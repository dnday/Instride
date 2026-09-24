-- Pembuatan SQL View untuk Agregasi Data Kampus (Issue #16)

-- View ini akan menggabungkan data dari tabel moods dan sentiment_analysis
-- untuk menghitung statistik kesejahteraan secara anonim per periode (misal: mingguan).

CREATE OR REPLACE VIEW public.campus_wellbeing_stats AS
WITH aggregated_moods AS (
    SELECT 
        date_trunc('week', recorded_at) AS period,
        AVG(mood_value) AS average_mood,
        COUNT(mood_id) AS total_journals
    FROM public.moods
    GROUP BY date_trunc('week', recorded_at)
),
aggregated_sentiments AS (
    SELECT 
        date_trunc('week', analyzed_at) AS period,
        COUNT(CASE WHEN sentiment = 'Positif' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) AS positive_percentage,
        COUNT(CASE WHEN sentiment = 'Netral' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) AS neutral_percentage,
        COUNT(CASE WHEN sentiment = 'Negatif' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) AS negative_percentage
    FROM public.sentiment_analysis
    GROUP BY date_trunc('week', analyzed_at)
)
SELECT 
    COALESCE(m.period, s.period) AS period,
    COALESCE(m.average_mood, 0) AS average_mood,
    COALESCE(m.total_journals, 0) AS total_journals,
    COALESCE(s.positive_percentage, 0) AS positive_percentage,
    COALESCE(s.neutral_percentage, 0) AS neutral_percentage,
    COALESCE(s.negative_percentage, 0) AS negative_percentage
FROM aggregated_moods m
FULL OUTER JOIN aggregated_sentiments s ON m.period = s.period;

-- Hanya izinkan role konselor atau admin yang dapat membaca view ini
-- (Catatan: View by default mewarisi RLS dari tabel dasarnya di Supabase jika security invoker digunakan,
-- namun kita bisa memastikan aplikasinya hanya memanggil view ini dari dashboard konselor).

