# Model sentimen Instride

Fine-tuning IndoBERT (`indobenchmark/indobert-base-p1`) untuk sentimen 3 kelas pada dataset SmSA (IndoNLU):
11.000 data latih, 1.260 validasi, 500 uji.

## Hasil pada data uji SmSA (500 kalimat)

| Model | Akurasi | Macro-F1 | F1 positif | F1 netral | F1 negatif |
| --- | --- | --- | --- | --- | --- |
| IndoBERT fine-tuned (jalur utama, lewat Hugging Face Space) | 0,916 | 0,888 | 0,937 | 0,782 | 0,944 |
| Leksikon InSet + negasi jendela 3 (cadangan saat Space tidak bisa dihubungi) | 0,552 | 0,439 | 0,579 | 0,106 | 0,631 |

Rincian precision/recall ada di `results/indobert_smsa.json` dan `results/lexicon_smsa.json`.
Training 9,9 menit di RTX 2050 4 GB (mixed precision).

Catatan: SmSA berisi ulasan dan komentar umum, bukan jurnal mahasiswa, jadi akurasi pada jurnal asli bisa berbeda.
Leksikon InSet sangat lemah di kelas netral (recall 0,07) karena hampir semua kata berbobot; ambang netral
sengaja **tidak** disetel agar tidak ada angka buatan. Bila tidak ada model maupun leksikon yang bisa dihubungi,
jurnal dibiarkan "Menunggu analisis" dan dicoba lagi nanti, bukan diberi label tebakan.

## Dasar setiap angka

| Angka | Nilai | Sumber |
| --- | --- | --- |
| Model dasar | `indobenchmark/indobert-base-p1` | Wilie dkk. (2020), IndoNLU |
| Dataset & label | SmSA, 3 kelas (positif/netral/negatif) | Purwarianti & Crisdayanti (2019), dipakai di IndoNLU |
| Learning rate | 2e-5 | Devlin dkk. (2019): {5e-5, 3e-5, 2e-5}; IndoNLU: rentang [1e-5, 4e-5] |
| Batch size | 16 | Devlin dkk. (2019): {16, 32}; IndoNLU: 16 |
| Epoch | 3, epoch terbaik dipilih dari macro-F1 validasi | Devlin dkk. (2019): {2, 3, 4}; IndoNLU: early stop pada skor validasi |
| Panjang input | 128 token | Kode referensi BERT (`run_classifier.py`); mencakup praktis seluruh SmSA (median 33, p95 79, maks 132 token) |
| Warmup | 10% langkah, lalu linear decay | Kode referensi BERT (`warmup_proportion = 0.1`) |
| Weight decay, gradient clipping | 0,01; norma 1,0 | Kode referensi BERT (`optimization.py`) |
| Kelas akhir model | label dengan skor tertinggi (argmax) | Praktik standar klasifikasi |
| Leksikon cadangan | InSet: 3.609 kata positif, 6.609 kata negatif, bobot -5..+5 | Koto & Rahmaningtyas (2017), IALP |
| Aturan skor leksikon | jumlah bobot; > 0 positif, < 0 negatif, 0 netral | Koto & Rahmaningtyas (2017) |
| Kata ingkar | tidak/tak, bukan, belum, jangan, tiada + ragam cakapan "tidak" (enggak, nggak, gak, ga) | Tata Bahasa Baku Bahasa Indonesia; KBBI |
| Jendela negasi | 3 token setelah kata ingkar | Studi negasi sentimen bahasa Indonesia (UGM, 2016): Fixed Window Length n = 3 terbaik |

Sumber:
- Devlin, J., Chang, M.-W., Lee, K., & Toutanova, K. (2019). BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding. NAACL. https://arxiv.org/abs/1810.04805
- google-research/bert, `run_classifier.py` dan `optimization.py`. https://github.com/google-research/bert
- Wilie, B. dkk. (2020). IndoNLU: Benchmark and Resources for Evaluating Indonesian Natural Language Understanding. AACL. https://arxiv.org/abs/2009.05387
- Koto, F., & Rahmaningtyas, G. Y. (2017). InSet Lexicon: Evaluation of a Word List for Indonesian Sentiment Analysis in Microblogs. IALP. doi:10.1109/IALP.2017.8300625. https://github.com/fajri91/InSet
- Penanganan negasi sentimen bahasa Indonesia (FSW, ROS, FWL n = 1-5), UGM 2016. https://etd.repository.ugm.ac.id/penelitian/detail/194063

## Menjalankan ulang

```bash
python -m venv ml/.venv
ml/.venv/Scripts/python -m pip install torch --index-url https://download.pytorch.org/whl/cu126
ml/.venv/Scripts/python -m pip install transformers scikit-learn
ml/.venv/Scripts/python ml/train_sentiment.py   # bobot ke ml/model/ (tidak di-commit)
node ml/eval_lexicon.mjs                        # evaluasi leksikon InSet (diunduh dari repo aslinya)
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

Space tidur setelah lama tidak dipakai; permintaan pertama bisa lambat dan jatuh ke leksikon InSet,
lalu jurnal berikutnya dianalisis IndoBERT.
