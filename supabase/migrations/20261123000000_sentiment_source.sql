-- Asal label sentimen: 'indobert' (model sendiri via Hugging Face Space) atau 'inset' (leksikon cadangan).
-- Label 'inset' bersifat sementara: Edge Function analyze-sentiment menganalisis ulang jurnalnya dengan IndoBERT
-- begitu Space aktif kembali (Issue #51). Baris yang sudah ada dianggap 'indobert' (asalnya tidak tercatat).
ALTER TABLE public.sentiment_analysis
    ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'indobert'
    CHECK (source IN ('indobert', 'inset'));
