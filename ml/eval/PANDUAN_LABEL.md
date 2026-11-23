# Data uji jurnal dan cara menambahnya

Tujuan: mengukur model sentimen Instride pada jurnal bergaya mahasiswa. Model hanya diuji di SmSA (ulasan produk dan film), jadi angkanya belum tentu berlaku untuk jurnal.

## Isi `jurnal_uji.csv`

185 baris berlabel (Netral 65, Positif 60, Negatif 60) ditambah 4 baris yang pelabelnya tidak sepakat (label kosong, dilewati skrip). Kolom:

| Kolom | Arti |
|---|---|
| `text` | Isi jurnal |
| `label_a` | Pelabel pertama (penyusun data untuk baris sintetis) |
| `label_b` | Pelabel kedua (tim), hanya terisi untuk baris yang ditinjau |
| `label` | Label akhir untuk evaluasi. Kosong = dibuang dari data uji |
| `sumber` | `tim` (ditinjau dua pelabel) atau `sintetis` (disusun dengan bantuan AI, label tunggal) |

**Batasan yang harus ditulis di laporan:** 175 dari 185 baris ditulis dan dilabeli oleh satu pihak (penyusun data, dengan bantuan AI) dengan gaya penulisan yang seragam, dan hanya 10 yang ditinjau tim (6 sepakat, 4 dibuang). Data seperti ini cenderung lebih mudah daripada jurnal asli, jadi akurasinya adalah batas atas, bukan klaim akurasi di dunia nyata. Cara memperbaikinya: tim atau teman menulis dan melabeli jurnal sendiri dengan aturan di bawah, lalu ditambahkan ke file ini dengan `sumber` = `tim`.

## Menambah baris

1. Satu baris = satu jurnal di kolom `text`. Tulis seperti jurnal sungguhan: 1 sampai 5 kalimat, boleh bahasa gaul, singkatan, dan campur Inggris.
2. Dua orang melabeli sendiri-sendiri tanpa saling melihat: `label_a` dan `label_b`. Nilai hanya `Positif`, `Netral`, atau `Negatif`.
3. Kalau sama, salin ke `label`. Kalau beda, **kosongkan `label`**: baris itu dibuang dari data uji (dihitung di `belum_diputuskan`). Catat berapa yang dibuang di laporan.

## Arti label

- **Positif**: perasaan utama jurnal menyenangkan (lega, senang, bangga, bersyukur).
- **Negatif**: perasaan utama tidak menyenangkan (capek, cemas, sedih, kesal, kewalahan).
- **Netral**: tidak ada perasaan yang dominan, hanya melaporkan kejadian, atau perasaan positif dan negatif seimbang.

Kalau ragu, lihat perasaan yang paling kuat dan perasaan di akhir jurnal. Labeli dari perasaan penulisnya, bukan dari kata yang muncul. Jurnal netral yang benar-benar datar sulit ditulis: petunjuk kecil seperti "belum ada keputusan" atau "tidur 6 jam" sudah membuat pembaca condong positif atau negatif.

## Aturan supaya angkanya bisa dipercaya

- Minimal 60 jurnal per kelas. Variasikan topik: tugas, skripsi, kos, keluarga, pertemanan, keuangan, organisasi, tidur.
- Jangan memakai jurnal asli mahasiswa tanpa izin tertulis. Berkas ini di-commit, jadi isinya harus rekaan.
- Jangan menyalin dari data latih SmSA.
- Jangan mengubah label setelah melihat hasil model.

## Menjalankan

```bash
python ml/eval_journal.py                  # IndoBERT (mnrsu/instride) pada jurnal_uji.csv
node ml/eval_lexicon.mjs                   # sekali saja, mengunduh InSet ke ml/data/
node ml/eval_journal_lexicon.mjs           # leksikon InSet pada data yang sama

python ml/prepare_emot.py                  # unduh EmoT dan petakan emosi ke Positif/Negatif
python ml/eval_journal.py --csv ml/data/emot_uji.csv --name emot --dataset "EmoT test (IndoNLU)"
node ml/eval_journal_lexicon.mjs ml/data/emot_uji.csv emot "EmoT test (IndoNLU)"
```

Node di bawah 22.18 butuh `node --experimental-strip-types ...`.

Metrik tersimpan di `ml/results/`. Jurnal yang salah ditebak ada di `ml/data/<nama>_salah.csv` untuk analisis error (folder `ml/data/` tidak di-commit).
