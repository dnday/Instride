-- Ambang anonimitas agregat kampus dinaikkan dari 5 ke 10 mahasiswa.
-- Dasar: praktik penekanan sel kecil pada statistik kesehatan publik. Illinois Department of Public Health
-- tidak mempublikasikan nilai 1-9; CMS menekan nilai yang berasal dari < 11 orang; literatur umumnya 10-15
-- (CalHHS Data De-identification Guidelines). Data jurnal & mood termasuk data kesehatan, yaitu data
-- pribadi spesifik menurut UU 27/2022 tentang Pelindungan Data Pribadi. Rujukan lengkap: PRIVASI_DAN_DASAR_KLINIS.md
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
    -- k-anonymity (k = 10): periode & tiap metrik yang berasal dari < 10 mahasiswa tidak ditampilkan
    SELECT active.period,
           CASE WHEN m.mood_users >= 10 THEN ROUND(m.average_mood, 2) END,
           COALESCE(j.total_journals, 0),
           active.active_students,
           CASE WHEN s.sentiment_users >= 10 THEN ROUND(s.positive_percentage, 2) END,
           CASE WHEN s.sentiment_users >= 10 THEN ROUND(s.neutral_percentage, 2) END,
           CASE WHEN s.sentiment_users >= 10 THEN ROUND(s.negative_percentage, 2) END
    FROM active
    LEFT JOIN m ON m.period = active.period
    LEFT JOIN j ON j.period = active.period
    LEFT JOIN s ON s.period = active.period
    WHERE active.active_students >= 10
    ORDER BY active.period;
$$;

REVOKE ALL ON FUNCTION private.compute_campus_stats() FROM PUBLIC;

-- Arsip lama yang dihitung dengan k = 5 dibuang; job terjadwal mengisi ulang dengan k = 10
DELETE FROM public.wellbeing_aggregation w
WHERE NOT EXISTS (SELECT 1 FROM private.compute_campus_stats() c WHERE to_char(c.period, 'YYYY-MM-DD') = w.period);
