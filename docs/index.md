# Instride

## lagi mikir

**Project Senior Project TI**

**Instansi:** Departemen Teknologi Elektro dan Teknologi Informasi, Fakultas Teknik, Universitas Gadjah Mada

Instride adalah aplikasi web untuk membantu mahasiswa memantau wellbeing secara personal sekaligus membantu institusi memahami tren kesejahteraan mahasiswa secara agregat dan berorientasi pada privasi.

## Anggota Kelompok

| Nama                              | NIM                | Peran                           |
| --------------------------------- | ------------------ | ------------------------------- |
| Marcelinus Dinoglide Yoga Prakoso | 24/533842/TK/59152 | Cloud Engineer, Project Manager |
| Muhammad Izzuddin Prakoso         | 24/537712/TK/59618 | Software Engineer               |
| Raka Bagus Samudra                | 24/543213/TK/60349 | AI Engineer, UI/UX Designer     |

## Modul 1: Perumusan Masalah

### Nama Produk

**Instride**

### Jenis Produk

Instride merupakan aplikasi web wellbeing mahasiswa berbasis kecerdasan buatan. Aplikasi ini menggabungkan mood tracker, jurnal harian, analisis sentimen berbahasa Indonesia, dashboard personal, dan dashboard agregat untuk institusi.

### Latar Belakang dan Permasalahan

Kesehatan mental mahasiswa menjadi isu yang semakin mendesak. Beban akademik seperti tugas kuliah dan skripsi dapat memicu stres, kecemasan, dan depresi. Walaupun prevalensinya tinggi, mahasiswa tidak selalu segera mencari bantuan karena khawatir terhadap penilaian sosial dan stigma ketika membicarakan masalah pribadi.

Pemantauan mood dan jurnal digital dapat membantu mahasiswa mengenali pola emosinya secara berkala. Namun, institusi juga membutuhkan informasi tentang tren wellbeing komunitas untuk menentukan dukungan yang tepat. Tantangannya adalah menyediakan insight tersebut tanpa membuka identitas atau isi jurnal pribadi mahasiswa.

Permasalahan yang hendak dijawab Instride adalah:

1. Bagaimana membantu mahasiswa memantau wellbeing secara sederhana dan konsisten?
2. Bagaimana menganalisis sentimen dan emosi jurnal berbahasa Indonesia secara otomatis?
3. Bagaimana mengubah data individual menjadi tren wellbeing komunitas tanpa mengekspos privasi mahasiswa?
4. Bagaimana menyajikan informasi tersebut dalam sistem cloud dan dashboard yang mudah dipahami?

### Ide Solusi

Instride menyediakan dua alur yang saling terhubung:

- **Sisi mahasiswa:** mahasiswa mencatat mood dan jurnal harian melalui form yang ringkas. Jurnal dianalisis menggunakan model NLP berbahasa Indonesia, seperti IndoBERT, lalu hasilnya ditampilkan sebagai riwayat dan tren wellbeing personal.
- **Sisi kampus:** data diproses menjadi statistik agregat, seperti rata-rata mood dan distribusi sentimen per periode. Unit konseling dapat melihat tren komunitas tanpa mengakses identitas maupun isi jurnal mahasiswa.

Dengan pendekatan ini, mahasiswa mendapat ruang refleksi mandiri, sedangkan institusi memperoleh dasar pengambilan keputusan yang lebih proaktif dan tetap menjaga privasi.

#### Rancangan Fitur

| Fitur                        | Keterangan                                                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Login dan role-based access  | Membedakan hak akses mahasiswa dan konselor sesuai kewenangan.                                                        |
| Mood tracker dan journal     | Mencatat mood serta refleksi harian melalui satu form yang ringkas.                                                   |
| Personal dashboard dan trend | Menampilkan riwayat mood dan sentimen untuk refleksi mandiri.                                                         |
| AI sentiment analysis        | Mengklasifikasikan jurnal berbahasa Indonesia menjadi sentimen positif, netral, atau negatif dengan bantuan IndoBERT. |
| Data aggregation engine      | Menghasilkan statistik agregat tanpa menyertakan identitas atau isi jurnal personal.                                  |
| Campus dashboard             | Menampilkan tren wellbeing komunitas bagi unit konseling dalam bentuk visual yang mudah dipahami.                     |

### Analisis Kompetitor

| Kompetitor    | Jenis dan target pengguna                                                    | Kelebihan                                                                                        | Kekurangan dibanding Instride                                                                            |
| ------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| **MoodMate**  | Aplikasi wellbeing berbasis AI untuk individu yang ingin memantau wellbeing. | Ekosistem personal wellbeing matang, smart tags, dan personalisasi kuat.                         | Berfokus pada individu; tidak memiliki konteks akademik dan alur kerja institusi.                        |
| **KALM**      | Platform kesehatan mental dan konseling psikologis untuk individu.           | Menyediakan konseling psikolog, journal, wellbeing tracker, dan layanan psikologis terintegrasi. | Berorientasi B2C; belum berfokus pada analitik tren wellbeing tingkat institusi.                         |
| **Tenang AI** | Platform dukungan emosional berbasis AI untuk individu.                      | Dukungan cepat, dapat diakses kapan saja, dan scalable.                                          | Tidak menggantikan psikolog; belum terintegrasi dengan layanan konseling kampus atau analitik komunitas. |

#### Keunggulan Instride

Instride menggabungkan pemantauan wellbeing personal, analisis AI berbahasa Indonesia, dan analitik agregat untuk kampus dalam satu alur. Nilai pembeda utamanya adalah dukungan pengambilan keputusan institusi yang tetap menjaga kerahasiaan data mahasiswa.

> Instride merupakan alat bantu pemantauan dan refleksi awal, bukan pengganti diagnosis atau layanan psikolog profesional.
