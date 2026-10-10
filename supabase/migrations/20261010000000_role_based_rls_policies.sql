-- Role-based RLS policies - melengkapi & mengeraskan kontrol akses per-role
-- Mencakup: R1-R10 dari spec role-based-rls-policies.
-- Urutan: trigger protection (C6) -> set_user_role (C7) -> moods (C1) ->
-- journals (C2) -> users SELECT/UPDATE (C4/C5) -> grants (C9) -> comments (C3/C8).
-- Semua statement idempoten (DROP ... IF EXISTS + CREATE / CREATE OR REPLACE).

-- ===============================================================
-- C6. Protect role & user_id from self-escalation (R4.3, R4.4, R5.1-5.3)
-- RLS WITH CHECK tidak bisa membandingkan OLD vs NEW, jadi pakai trigger.
-- ===============================================================
CREATE OR REPLACE FUNCTION public.protect_user_columns()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Service_role (via set_user_role) boleh mengubah role/user_id.
    IF current_setting('role_change.allow', true) = 'on'
       OR current_user IN ('service_role', 'postgres')
       OR session_user IN ('service_role', 'postgres') THEN
        RETURN NEW;
    END IF;

    -- Koneksi lain: identitas & otorisasi immutable.
    NEW.role    := OLD.role;
    NEW.user_id := OLD.user_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_user_columns ON public.users;
CREATE TRIGGER protect_user_columns
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.protect_user_columns();

-- ===============================================================
-- C7. Controlled role assignment - satu-satunya jalan ubah role (R6, R8)
-- ===============================================================
CREATE OR REPLACE FUNCTION public.set_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF new_role NOT IN ('mahasiswa', 'konselor', 'admin') THEN
        RAISE EXCEPTION 'invalid role: %', new_role
            USING ERRCODE = 'check_violation';
    END IF;

    -- Izinkan trigger protection melewatkan perubahan role untuk statement ini.
    PERFORM set_config('role_change.allow', 'on', true);

    UPDATE public.users
       SET role = new_role
     WHERE user_id = target_user_id;  -- zero rows jika target tidak ada (no-op)

    PERFORM set_config('role_change.allow', 'off', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, text) FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, text) TO service_role;
    END IF;
END $$;

-- ===============================================================
-- C1. Moods - UPDATE & DELETE milik sendiri (R1)
-- SELECT & INSERT sudah ada dari init schema - jangan diubah.
-- ===============================================================
DROP POLICY IF EXISTS "Users can update own moods" ON public.moods;
CREATE POLICY "Users can update own moods" ON public.moods
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own moods" ON public.moods;
CREATE POLICY "Users can delete own moods" ON public.moods
    FOR DELETE
    USING (auth.uid() = user_id);

-- ===============================================================
-- C2. Journals - UPDATE & DELETE milik sendiri (R2)
-- sentiment_analysis ikut terhapus via FK ON DELETE CASCADE (R3.2).
-- ===============================================================
DROP POLICY IF EXISTS "Users can update own journals" ON public.journals;
CREATE POLICY "Users can update own journals" ON public.journals
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own journals" ON public.journals;
CREATE POLICY "Users can delete own journals" ON public.journals
    FOR DELETE
    USING (auth.uid() = user_id);

-- ===============================================================
-- C4/C5. Users - SELECT own-only + UPDATE own-only (R4.1, R4.2, R4.5)
-- Proteksi role/user_id diserahkan ke trigger C6.
-- ===============================================================
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile" ON public.users
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Pastikan tidak ada kebijakan "Konselor can read all profiles" yang tersisa.
DROP POLICY IF EXISTS "Konselor can read all profiles" ON public.users;

-- ===============================================================
-- C9. Grants untuk operasi tulis baru (R9.2)
-- anon sengaja TIDAK diberi akses tulis.
-- ===============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        GRANT UPDATE, DELETE ON public.moods TO authenticated;
        GRANT UPDATE, DELETE ON public.journals TO authenticated;
        GRANT UPDATE ON public.users TO authenticated;
    END IF;
END $$;

-- ===============================================================
-- C3. sentiment_analysis (tidak ada perubahan - sengaja)
--    SELECT via journal milik sendiri sudah ada; tidak ada policy INSERT/UPDATE/
--    DELETE sehingga tulis langsung otomatis ditolak (default-deny). (R3.4)
-- C8. Campus aggregation (tidak ada perubahan - sengaja)
--    campus_wellbeing_stats(), private.compute_campus_stats(), dan policy SELECT
--    wellbeing_aggregation sengaja tidak disentuh agar k-anonymity tidak melemah. (R7, R8)
-- ================================================================
