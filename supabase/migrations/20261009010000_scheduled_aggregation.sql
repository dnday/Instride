-- Agregasi wellbeing terjadwal ke tabel wellbeing_aggregation (Data Aggregation Engine)

-- 1. Perhitungan dipindah ke schema private (tidak diekspos Data API) agar bisa dipakai
--    dashboard (dengan cek role) maupun job terjadwal (tanpa sesi user).
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.compute_campus_stats()
RETURNS TABLE (
    period TIMESTAMPTZ,
    average_mood NUMERIC,
    total_journals BIGINT,
    active_students BIGINT,
    positive_percentage NUMERIC,
    neutral_percentage NUMERIC,
    negative_percentage NUMERIC
)
LANGUAGE sql STABLE SET search_path = public
AS $$
    WITH m AS (
        SELECT date_trunc('week', recorded_at) AS period,
               AVG(mood_value) AS average_mood,
               COUNT(DISTINCT user_id) AS mood_users
        FROM moods GROUP BY 1
    ),
    j AS (
        SELECT date_trunc('week', created_at) AS period,
               COUNT(*) AS total_journals
        FROM journals GROUP BY 1
    ),
    s AS (
        SELECT date_trunc('week', sa.analyzed_at) AS period,
               COUNT(*) FILTER (WHERE sa.sentiment = 'Positif') * 100.0 / COUNT(*) AS positive_percentage,
               COUNT(*) FILTER (WHERE sa.sentiment = 'Netral')  * 100.0 / COUNT(*) AS neutral_percentage,
               COUNT(*) FILTER (WHERE sa.sentiment = 'Negatif') * 100.0 / COUNT(*) AS negative_percentage,
               COUNT(DISTINCT jr.user_id) AS sentiment_users
        FROM sentiment_analysis sa
        JOIN journals jr ON jr.journal_id = sa.journal_id
        GROUP BY 1
    ),
    a AS (
        SELECT date_trunc('week', recorded_at) AS period, user_id FROM moods
        UNION
        SELECT date_trunc('week', created_at), user_id FROM journals
    ),
    active AS (
        SELECT period, COUNT(DISTINCT user_id) AS active_students FROM a GROUP BY 1
    )
    -- k-anonymity (k = 5): periode & metrik dari < 5 mahasiswa tidak ditampilkan
    SELECT active.period,
           CASE WHEN m.mood_users >= 5 THEN ROUND(m.average_mood, 2) END,
           COALESCE(j.total_journals, 0),
           active.active_students,
           CASE WHEN s.sentiment_users >= 5 THEN ROUND(s.positive_percentage, 2) END,
           CASE WHEN s.sentiment_users >= 5 THEN ROUND(s.neutral_percentage, 2) END,
           CASE WHEN s.sentiment_users >= 5 THEN ROUND(s.negative_percentage, 2) END
    FROM active
    LEFT JOIN m ON m.period = active.period
    LEFT JOIN j ON j.period = active.period
    LEFT JOIN s ON s.period = active.period
    WHERE active.active_students >= 5
    ORDER BY active.period;
$$;

REVOKE ALL ON FUNCTION private.compute_campus_stats() FROM PUBLIC;

-- Dashboard konselor tetap real-time, sekarang lewat fungsi bersama di atas
CREATE OR REPLACE FUNCTION public.campus_wellbeing_stats()
RETURNS TABLE (
    period TIMESTAMPTZ,
    average_mood NUMERIC,
    total_journals BIGINT,
    active_students BIGINT,
    positive_percentage NUMERIC,
    neutral_percentage NUMERIC,
    negative_percentage NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT * FROM private.compute_campus_stats() WHERE public.is_konselor();
$$;

-- 2. Tabel arsip agregat mingguan
ALTER TABLE public.wellbeing_aggregation
    ADD COLUMN IF NOT EXISTS total_journals INT,
    ADD COLUMN IF NOT EXISTS active_students INT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.wellbeing_aggregation
    ADD CONSTRAINT wellbeing_aggregation_period_key UNIQUE (period);

-- period disimpan sebagai tanggal awal minggu, mis. '2026-10-05'
CREATE OR REPLACE FUNCTION public.refresh_wellbeing_aggregation()
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE n INT;
BEGIN
    INSERT INTO wellbeing_aggregation AS w
        (period, average_mood, total_journals, active_students,
         positive_percentage, neutral_percentage, negative_percentage, updated_at)
    SELECT to_char(c.period, 'YYYY-MM-DD'), c.average_mood, c.total_journals, c.active_students,
           c.positive_percentage, c.neutral_percentage, c.negative_percentage, NOW()
    FROM private.compute_campus_stats() c
    ON CONFLICT (period) DO UPDATE SET
        average_mood = EXCLUDED.average_mood,
        total_journals = EXCLUDED.total_journals,
        active_students = EXCLUDED.active_students,
        positive_percentage = EXCLUDED.positive_percentage,
        neutral_percentage = EXCLUDED.neutral_percentage,
        negative_percentage = EXCLUDED.negative_percentage,
        updated_at = NOW();
    GET DIAGNOSTICS n = ROW_COUNT;
    RETURN n;
END;
$$;

-- Hanya dijalankan oleh job terjadwal / admin, bukan dari aplikasi
REVOKE EXECUTE ON FUNCTION public.refresh_wellbeing_aggregation() FROM PUBLIC, anon, authenticated;

-- 3. Jadwal: setiap hari 00:05 WIB (17:05 UTC). Dilewati jika pg_cron tidak tersedia (mis. DB lokal).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
        CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
        PERFORM cron.schedule('refresh-wellbeing-aggregation', '5 17 * * *',
                              'SELECT public.refresh_wellbeing_aggregation()');
    ELSE
        RAISE NOTICE 'pg_cron tidak tersedia, jadwal agregasi dilewati';
    END IF;
END;
$$;
