-- Buat profil public.users otomatis saat signup Supabase Auth (Issue #8)
-- moods/journals punya FK ke public.users; tanpa baris ini insert mood/jurnal gagal.

-- Role selalu 'mahasiswa' (default kolom) dan tidak diambil dari metadata signup,
-- agar pengguna tidak bisa mendaftar sebagai konselor. Konselor di-set manual oleh admin.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (user_id, name, email)
    VALUES (
        NEW.id,
        COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'name'), ''), split_part(NEW.email, '@', 1)),
        NEW.email
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Akun yang sudah terdaftar sebelum trigger ini ada
INSERT INTO public.users (user_id, name, email)
SELECT id, COALESCE(NULLIF(trim(raw_user_meta_data ->> 'name'), ''), split_part(email, '@', 1)), email
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
