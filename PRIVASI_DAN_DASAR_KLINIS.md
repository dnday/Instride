# Privasi & Dasar Klinis Instride

Ringkasan keputusan pengolahan data dan fitur kesehatan mental Instride beserta rujukannya.
Instride adalah alat bantu refleksi, **bukan** perangkat diagnosis.

## 1. Status hukum data

| Keputusan | Dasar |
| --- | --- |
| Mood dan jurnal diperlakukan sebagai **data kesehatan**, yaitu data pribadi bersifat spesifik. | UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi membagi data pribadi menjadi spesifik dan umum; data dan informasi kesehatan termasuk spesifik. |
| Pendaftaran (email maupun Google) mewajibkan **persetujuan eksplisit**; waktu persetujuan disimpan di metadata akun (`consent_at`). | Pemrosesan data pribadi spesifik membutuhkan dasar yang jelas; persetujuan dipilih karena Instride bukan fasilitas pelayanan kesehatan. |
| Halaman **Kebijakan Privasi** (`/privasi`) menjelaskan data, tujuan, pihak pemroses, dan hak pengguna. | Transparansi kepada subjek data (UU 27/2022). |
| Pengguna dapat **menghapus semua catatan** atau **menghapus akun** beserta seluruh datanya dari halaman Profil (Edge Function `delete-account`). | Hak subjek data atas penghapusan (UU 27/2022). |
| Keamanan: RLS di database, kampus tanpa akses identitas, timestamp ditentukan server, token AI hanya di server. | Prinsip kerahasiaan, integritas, dan ketersediaan data kesehatan (selaras Permenkes No. 24/2022 tentang Rekam Medis, Pasal 29, untuk fasilitas kesehatan). |

Catatan: Instride bukan fasilitas pelayanan kesehatan, sehingga Permenkes 24/2022 tidak berlaku langsung; prinsip keamanannya dipakai sebagai acuan. Nomor pasal UU PDP belum dikutip karena teks resmi belum dicek langsung.

## 2. Anonimitas statistik kampus (k = 10)

Statistik untuk unit konseling hanya berupa agregat mingguan. **Minggu atau metrik yang berasal dari kurang dari 10 mahasiswa disembunyikan** (`private.compute_campus_stats()`, migration `20261113000000_k_anonymity_10.sql`). Sebelumnya ambangnya 5.

Dasar pemilihan 10:
- Tidak ada satu standar nasional; ambang yang umum dipakai antara 5 dan 11, dan literatur berkisar 3–40 dengan banyak di 10–15 (CalHHS Data De-identification Guidelines).
- Illinois Department of Public Health umumnya tidak mempublikasikan nilai 1–9.
- CMS menekan nilai yang berasal dari kurang dari 11 orang, untuk standar de-identifikasi HIPAA.

10 dipilih sebagai titik tengah yang ketat namun masih memungkinkan data muncul pada skala uji coba kampus. Diuji di `tests/database.test.mjs` (10 mahasiswa tampil, 9 mahasiswa disembunyikan).

## 3. Pengukuran kesehatan mental

| Keputusan | Dasar dan batasan |
| --- | --- |
| Mood harian memakai **satu butir skala 1–5**. | Ukuran satu butir lazim pada ecological momentary assessment (EMA) di aplikasi ponsel; tinjauan 2026 menemukan 74% instrumen stres EMA berupa satu butir. Namun versi singkat tidak otomatis mempertahankan sifat psikometrik instrumen aslinya, jadi skor ini **hanya untuk refleksi**, bukan skrining. |
| Sentimen jurnal dari IndoBERT ditampilkan sebagai **positif/netral/negatif**, bukan label klinis. | Model dilatih pada SmSA (ulasan umum), bukan data klinis; akurasi uji 91,6% (lihat `ml/README.md`). |
| Kandidat pengembangan: **WHO-5 Well-Being Index** versi Indonesia untuk penilaian mingguan. | Sudah divalidasi dalam bahasa Indonesia (Latifa dkk., JP3I 2023, dengan CFA dan IRT). Belum diimplementasikan. |

## 4. Rujukan krisis

Jika jurnal yang baru disimpan mengandung ungkapan ingin menyakiti diri atau mengakhiri hidup, aplikasi langsung menampilkan kartu bantuan berisi Layanan SEJIWA Kemenkes (119 ext. 8) dan nomor darurat 112 (`src/lib/crisis.ts`, `src/components/CrisisNotice.tsx`).

- Dasar: WHO mendorong layanan kesehatan mental digital dan berbasis AI memiliki jalur rujukan krisis (workshop WHO, Januari 2026), serta menempatkan platform digital sebagai bagian dari sistem layanan kesehatan mental yang lebih luas (laporan WHO 2024).
- Privasi: deteksi berjalan di perangkat pengguna, hasilnya tidak disimpan dan tidak dikirim ke kampus.
- Bahasa pesan: tenang, tidak menghakimi, langsung berisi kontak.
- Batasan: deteksi berbasis pola kata, bukan penilaian risiko klinis; salah deteksi hanya memunculkan kartu bantuan.

## Sumber

- [UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (JDIH Kemenkeu)](https://jdih.kemenkeu.go.id/download/46c17b53-4a45-411c-9b76-c6799e5769fc/UU_Nomor_27_Tahun_2022%20Perlindungan%20Data%20Pribadi.pdf)
- [Implikasi UU PDP terhadap data pasien (Hukumonline)](https://www.hukumonline.com/berita/a/implikasi-uu-pdp-terhadap-data-pasien-lt634fd7122856c/?page=all)
- [Permenkes No. 24 Tahun 2022 tentang Rekam Medis (Pasal.id)](https://pasal.id/peraturan/permen/permenkes-no-24-tahun-2022)
- [CalHHS Data De-identification Guidelines: justifikasi ambang](https://kb.data.chhs.ca.gov/ddg/6.-justification-of-thresholds-identified/6.2-assessing-potential-risk-publication-scoring-criteria)
- [Illinois Department of Public Health: Aggregate Data Suppression Policy (2025)](https://dph.illinois.gov/content/dam/soi/en/web/idph/resources/data-statistics/aggregate-data-suppression-policy-09242025.pdf)
- [Public Health Law Center: Small Numbers Policies and Data Suppression](https://www.publichealthlawcenter.org/resources/small-numbers-policies-and-data-suppression-what-health-department-attorneys-need-know)
- [Latifa dkk. (2023), Indonesian Version of WHO-5 Well-being Index, JP3I](https://journal.uinjkt.ac.id/index.php/jp3i/article/view/33964)
- [Tinjauan ukuran stres EMA berbasis ponsel (JMIR mHealth, 2026)](https://mhealth.jmir.org/2026/1/e94204/PDF)
- [EMA masalah kesehatan mental mahasiswa: evaluasi kualitas data (JMIR, 2024)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11668991/)
- [WHO: laporan konten kesehatan mental untuk anak muda (2024)](https://www.who.int/news/item/06-02-2024-announcement--who-meeting-report-released-on-mental-health-content-that-supports-young-people)
- [WHO: rekomendasi AI yang bertanggung jawab untuk kesehatan mental (HTN, 2026)](https://htn.co.uk/2026/03/23/who-issues-three-recommendations-for-responsible-ai-use-in-mental-health-and-wellbeing/)
