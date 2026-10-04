-- Perbaikan RLS & agregasi kampus (lanjutan Issue #5 & #16)

-- 1. Cek role tanpa rekursi RLS (policy pada public.users tidak boleh query public.users)
CREATE OR REPLACE FUNCTION public.is_konselor()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE user_id = auth.uid() AND role IN ('konselor', 'admin')
    );
$$;

-- FR4: kampus tidak boleh mengakses identitas mahasiswa
DROP POLICY IF EXISTS "Konselor can read all profiles" ON public.users;

DROP POLICY IF EXISTS "Konselor can read aggregated wellbeing data" ON public.wellbeing_aggregation;
CREATE POLICY "Konselor can read aggregated wellbeing data" ON public.wellbeing_aggregation
    FOR SELECT USING (public.is_konselor());

-- 2. Agregasi kampus: view lama bisa dibaca role mana pun (view berjalan sebagai owner,
-- melewati RLS) dan tidak punya batas anonimitas. Diganti fungsi yang dicek role-nya.
DROP VIEW IF EXISTS public.campus_wellbeing_stats;

-- Minggu dengan < 5 mahasiswa aktif disembunyikan agar individu tidak bisa ditebak.
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
    WITH m AS (
        SELECT date_trunc('week', recorded_at) AS period,
               AVG(mood_value) AS average_mood,
               COUNT(DISTINCT user_id) AS mood_users
        FROM moods GROUP BY 1
    ),
    j AS (
        SELECT date_trunc('week', created_at) AS period,
               COUNT(*) AS total_journals,
               COUNT(DISTINCT user_id) AS journal_users
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
    -- Metrik yang berasal dari < 5 orang juga di-NULL-kan (rata-rata 1 orang = data 1 orang)
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
    WHERE public.is_konselor()
      AND active.active_students >= 5
    ORDER BY active.period;
$$;

REVOKE EXECUTE ON FUNCTION public.campus_wellbeing_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.campus_wellbeing_stats() TO authenticated;
