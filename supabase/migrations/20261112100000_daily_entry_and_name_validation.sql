-- Catatan harian (mood + jurnal dalam satu simpan) dan validasi nama profil.
-- Semua perintah aman dijalankan ulang (idempoten).

-- 1. Nama profil: tidak boleh kosong, maksimal 100 karakter.
--    NOT VALID: baris lama tidak diperiksa ulang, baris baru/yang diubah wajib lolos.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_name_check;
ALTER TABLE public.users
    ADD CONSTRAINT users_name_check
    CHECK (btrim(name) <> '' AND char_length(name) <= 100) NOT VALID;

-- Signup tidak boleh gagal karena nama dari Google/metadata terlalu panjang:
-- nama dipotong ke 100 karakter, dan bila kosong dipakai bagian depan email.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (user_id, name, email)
    VALUES (
        NEW.id,
        left(
            COALESCE(NULLIF(btrim(NEW.raw_user_meta_data ->> 'name'), ''), split_part(NEW.email, '@', 1)),
            100
        ),
        NEW.email
    );
    RETURN NEW;
END;
$$;

-- 2. Simpan mood + jurnal sekaligus dalam satu transaksi.
--    Jurnal opsional: kosong/spasi saja berarti hanya mood yang disimpan.
--    SECURITY INVOKER: RLS tetap berlaku (hanya mahasiswa, hanya data milik sendiri),
--    dan trigger timestamp server tetap jalan. Kalau insert jurnal gagal, mood ikut batal.
CREATE OR REPLACE FUNCTION public.save_daily_entry(p_mood INT, p_content TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_mood_id INT;
    v_journal_id INT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Sesi tidak valid' USING ERRCODE = '28000';
    END IF;

    -- Pesan dan kode error dibaca oleh mapSaveError di frontend
    IF p_mood IS NULL OR p_mood NOT BETWEEN 1 AND 5 THEN
        RAISE EXCEPTION 'Mood harus bernilai antara 1 sampai 5' USING ERRCODE = '22023';
    END IF;
    IF p_content IS NOT NULL AND char_length(p_content) > 5000 THEN
        RAISE EXCEPTION 'journals_content_check: Jurnal maksimal 5000 karakter' USING ERRCODE = '23514';
    END IF;

    INSERT INTO public.moods (user_id, mood_value)
    VALUES (v_uid, p_mood)
    RETURNING mood_id INTO v_mood_id;

    IF p_content IS NOT NULL AND btrim(p_content) <> '' THEN
        INSERT INTO public.journals (user_id, content)
        VALUES (v_uid, p_content)
        RETURNING journal_id INTO v_journal_id;
    END IF;

    RETURN jsonb_build_object('mood_id', v_mood_id, 'journal_id', v_journal_id);
END;
$$;

REVOKE ALL ON FUNCTION public.save_daily_entry(INT, TEXT) FROM PUBLIC;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON FUNCTION public.save_daily_entry(INT, TEXT) FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        GRANT EXECUTE ON FUNCTION public.save_daily_entry(INT, TEXT) TO authenticated;
    END IF;
END $$;
