-- Satu hasil sentimen per jurnal (Edge Function analyze-sentiment memakai upsert ON CONFLICT journal_id).
-- Hapus duplikat lama dulu, sisakan hasil terbaru.
DELETE FROM public.sentiment_analysis a
USING public.sentiment_analysis b
WHERE a.journal_id = b.journal_id AND a.sentiment_id < b.sentiment_id;

ALTER TABLE public.sentiment_analysis DROP CONSTRAINT IF EXISTS sentiment_analysis_journal_id_key;
ALTER TABLE public.sentiment_analysis ADD CONSTRAINT sentiment_analysis_journal_id_key UNIQUE (journal_id);
