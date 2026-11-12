# Model sentimen Instride

Fine-tuning IndoBERT (`indobenchmark/indobert-base-p1`) untuk sentimen 3 kelas pada dataset SmSA (IndoNLU):
11.000 data latih, 1.260 validasi, 500 uji.

## Hasil pada data uji SmSA (500 kalimat)

| Model | Akurasi | Macro-F1 | F1 positif | F1 netral | F1 negatif |
| --- | --- | --- | --- | --- | --- |
| IndoBERT fine-tuned (3 epoch, epoch terbaik menurut validasi) | 0,916 | 0,888 | 0,937 | 0,782 | 0,944 |
| Fallback kamus kata (`supabase/functions/_shared/sentiment.ts`) | 0,660 | 0,652 | 0,771 | 0,510 | 0,675 |

Rincian precision/recall ada di `results/indobert_smsa.json` dan `results/lexicon_smsa.json`.
Training 9,9 menit di RTX 2050 4 GB (batch 16, max_len 128, lr 2e-5, mixed precision).

Catatan: SmSA berisi ulasan dan komentar umum, bukan jurnal mahasiswa, jadi akurasi pada jurnal asli bisa berbeda.
Kelas netral paling lemah (recall 0,69).

## Menjalankan ulang

```bash
python -m venv ml/.venv
ml/.venv/Scripts/python -m pip install torch --index-url https://download.pytorch.org/whl/cu126
ml/.venv/Scripts/python -m pip install transformers scikit-learn
ml/.venv/Scripts/python ml/train_sentiment.py   # bobot ke ml/model/ (tidak di-commit)
node ml/eval_lexicon.mjs                        # evaluasi fallback kamus kata
```

## Memakai model ini di aplikasi

Model sudah diunggah ke [mnrsu/instride](https://huggingface.co/mnrsu/instride). HF Inference gratis tidak melayani
model unggahan sendiri (`Model not supported by provider hf-inference`), jadi model dijalankan di Hugging Face Space
(SDK Gradio, hardware ZeroGPU) dari folder `ml/space/`.

- Endpoint API: `POST /gradio_api/call/predict` dengan `{"data": ["<teks>", "<API_KEY>"]}`, lalu
  `GET /gradio_api/call/predict/<event_id>` (SSE). Berjalan di CPU supaya tidak memakai kuota ZeroGPU.
- Halaman utama Space untuk uji manual memakai GPU (`@spaces.GPU`, wajib ada di ZeroGPU).

Langkah:
1. Buat Space Gradio (template Blank, hardware ZeroGPU), isi secret `API_KEY` dengan string acak,
   lalu unggah `app.py`, `requirements.txt`, `README.md` dari `ml/space/`.
2. Di repo GitHub: variable `SENTIMENT_URL` = URL Space (`https://mnrsu-instride-sentiment.hf.space`),
   secret `SENTIMENT_KEY` = nilai `API_KEY` yang sama.
3. Jalankan ulang workflow CI; CI meneruskan keduanya ke secret Supabase saat deploy Edge Function.

Space tidur setelah lama tidak dipakai; permintaan pertama bisa lambat dan jatuh ke kamus kata,
lalu jurnal berikutnya dianalisis IndoBERT.
