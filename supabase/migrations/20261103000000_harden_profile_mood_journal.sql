-- Pengetatan hasil review: kolom profil, insert mood/jurnal per role, timestamp, dan panjang jurnal.
-- Semua perintah aman dijalankan ulang (idempoten).

-- 1. Profil: mahasiswa hanya boleh mengubah `name`.
--    Sebelumnya `email` (UNIQUE) bisa diubah lewat API sehingga user bisa "mengklaim" email orang lain
--    dan membuat signup orang tersebut gagal di trigger on_auth_user_created.
CREATE OR REPLACE FUNCTION public.protect_user_email()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
BEGIN
    IF current_user IN ('anon', 'authenticated') THEN
        NEW.email := OLD.email;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_user_email ON public.users;
CREATE TRIGGER protect_user_email
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.protect_user_email();

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE UPDATE ON public.users FROM authenticated;
        GRANT UPDATE (name) ON public.users TO authenticated;
    END IF;
END $$;

-- Email di public.users mengikuti perubahan email di Supabase Auth.
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    UPDATE public.users SET email = NEW.email WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION public.sync_user_email();

-- 2. Hanya mahasiswa yang mencatat mood/jurnal, supaya data konselor/admin
--    tidak ikut statistik kampus dan hitungan k-anonymity.
DROP POLICY IF EXISTS "Users can insert own moods" ON public.moods;
CREATE POLICY "Users can insert own moods" ON public.moods
    FOR INSERT WITH CHECK (auth.uid() = user_id AND NOT public.is_konselor());

DROP POLICY IF EXISTS "Users can insert own journals" ON public.journals;
CREATE POLICY "Users can insert own journals" ON public.journals
    FOR INSERT WITH CHECK (auth.uid() = user_id AND NOT public.is_konselor());

-- 3. Timestamp ditentukan server. Lewat API, client tidak bisa mengisi tanggal lampau/masa depan
--    saat insert, dan tidak bisa menggeser tanggal saat update (mencegah manipulasi agregat mingguan).
--    Seed/migrasi/service_role tetap bebas mengisi tanggal.
CREATE OR REPLACE FUNCTION public.enforce_server_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE
    col TEXT := TG_ARGV[0];
BEGIN
    IF current_user NOT IN ('anon', 'authenticated') THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'INSERT' THEN
        NEW := jsonb_populate_record(NEW, jsonb_build_object(col, now()));
    ELSE
        NEW := jsonb_populate_record(NEW, jsonb_build_object(col, to_jsonb(OLD) -> col));
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_server_timestamp ON public.moods;
CREATE TRIGGER enforce_server_timestamp
    BEFORE INSERT OR UPDATE ON public.moods
    FOR EACH ROW EXECUTE FUNCTION public.enforce_server_timestamp('recorded_at');

DROP TRIGGER IF EXISTS enforce_server_timestamp ON public.journals;
CREATE TRIGGER enforce_server_timestamp
    BEFORE INSERT OR UPDATE ON public.journals
    FOR EACH ROW EXECUTE FUNCTION public.enforce_server_timestamp('created_at');

-- 4. Batas isi jurnal juga ditegakkan di database (sebelumnya hanya di client).
--    NOT VALID: baris lama tidak diperiksa ulang, baris baru/yang diubah wajib lolos.
ALTER TABLE public.journals DROP CONSTRAINT IF EXISTS journals_content_check;
ALTER TABLE public.journals
    ADD CONSTRAINT journals_content_check
    CHECK (char_length(content) <= 5000 AND btrim(content) <> '') NOT VALID;
