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

Edge Function `analyze-sentiment` memanggil Hugging Face Inference. Unggah `ml/model/` ke Hugging Face Hub,
lalu isi variable repo `HF_MODEL` dengan nama modelnya dan secret `HF_TOKEN` dengan token akun tersebut.
Label model (`positive`/`neutral`/`negative`) sudah dikenali `labelToSentiment`.
