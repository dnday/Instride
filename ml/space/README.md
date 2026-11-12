---
title: Instride Sentiment
emoji: 🌱
colorFrom: green
colorTo: gray
sdk: docker
app_port: 7860
pinned: false
---

API analisis sentimen jurnal untuk Instride, menjalankan model [mnrsu/instride](https://huggingface.co/mnrsu/instride)
(IndoBERT fine-tuned pada SmSA). Dipanggil oleh Supabase Edge Function `analyze-sentiment`; request wajib membawa API key.
