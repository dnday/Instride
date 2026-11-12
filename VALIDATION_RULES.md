# Instride Validation Rules

Dokumen ini mendefinisikan aturan validasi input pada aplikasi Instride. Validasi digunakan untuk memastikan data yang diberikan pengguna memenuhi persyaratan sebelum diproses oleh sistem.

Validasi diterapkan pada sisi frontend dan backend.

---

# 1. General Validation Rules

- Validasi dilakukan sebelum input diproses lebih lanjut.
- Input yang tidak memenuhi aturan validasi harus ditolak.
- Validation error harus memberikan informasi mengenai field yang bermasalah.
- Validation hanya memeriksa kelengkapan dan format/nilai input.
- Validation tidak menentukan apakah credentials pengguna benar.
- Authentication bertanggung jawab untuk memeriksa credentials pengguna.
- Validation tidak menggantikan authentication maupun authorization.

---

# 2. Authentication Input Validation

## 2.1 Register

### Fields

| Field | Required | Validation |
|---|---|---|
| `name` | Yes | Tidak boleh kosong, maksimal 100 karakter |
| `email` | Yes | Tidak boleh kosong dan harus memiliki format email yang valid |
| `password` | Yes | Tidak boleh kosong, minimal 6 karakter |

### Rules

- `name` wajib diisi.
- `name` tidak boleh kosong.
- `name` maksimal 100 karakter (dihitung setelah spasi di awal/akhir dibuang). Pesan: `Nama maksimal 100 karakter`. Database menegakkan aturan yang sama (`users_name_check`).
- `email` wajib diisi.
- `email` tidak boleh kosong.
- `email` harus memiliki format email yang valid.
- `password` wajib diisi.
- `password` tidak boleh kosong.
- `password` minimal 6 karakter (sama dengan `minimum_password_length` Supabase Auth). Pesan: `Password minimal 6 karakter`.
- Sistem harus menolak input apabila salah satu field wajib tidak tersedia atau kosong.

### Valid Example

{
  "name": "Nama Mahasiswa",
  "email": "mahasiswa@example.com",
  "password": "password123"
}

### Invalid Example — Field Kosong

{
  "name": "",
  "email": "mahasiswa@example.com",
  "password": "password123"
}

Expected result: sistem menampilkan validation error dan proses registrasi tidak dilakukan.

> Aturan ini sesuai dengan test case `TC-AUTH-002`, yang menguji register dengan salah satu atau beberapa field kosong. :contentReference[oaicite:0]{index=0}

---

## 2.2 Login

### Fields

| Field | Required | Validation |
|---|---|---|
| `email` | Yes | Tidak boleh kosong dan harus memiliki format email yang valid |
| `password` | Yes | Tidak boleh kosong |

### Rules

- `email` wajib diisi.
- `email` tidak boleh kosong.
- `email` harus memiliki format email yang valid.
- `password` wajib diisi.
- `password` tidak boleh kosong.
- Sistem harus menolak input apabila salah satu field wajib tidak tersedia atau kosong.
- Validasi input dilakukan sebelum proses authentication.

### Valid Example

{
  "email": "mahasiswa@example.com",
  "password": "password123"
}

### Invalid Example — Email Kosong

{
  "email": "",
  "password": "password123"
}

Expected result: sistem menampilkan validation error.

> Password yang salah atau email yang tidak terdaftar bukan validation rule. Kedua kondisi tersebut merupakan hasil dari proses authentication dan sudah diuji secara terpisah melalui `TC-AUTH-004` dan `TC-AUTH-005`. :contentReference[oaicite:1]{index=1}

---

# 3. Mood Tracker Validation

## 3.1 Create Mood

### Fields

| Field | Required | Validation |
|---|---|---|
| `mood` | Yes | Nilai harus berada pada skala 1–5 |

### Rules

- `mood` wajib diisi.
- `mood` harus memiliki nilai pada rentang 1 sampai 5.
- Sistem harus menolak input apabila `mood` tidak tersedia.
- Sistem harus menolak input apabila nilai `mood` berada di luar rentang 1–5.

### Valid Example

{
  "mood": 4
}

### Invalid Example — Mood Kosong

{}

Expected result: sistem menolak input dan menampilkan pesan validasi.

### Invalid Example — Di Luar Rentang

{
  "mood": 6
}

Expected result: sistem menolak input.

> Aturan mood 1–5 dan kondisi mood kosong/di luar rentang tercermin dalam `TC-MOOD-001` sampai `TC-MOOD-003`. :contentReference[oaicite:2]{index=2}

---

# 4. Journal Validation

## 4.1 Create Journal

### Fields

| Field | Required | Validation |
|---|---|---|
| `content` | No (pada Catatan Harian) | Boleh kosong; bila diisi maksimal 5000 karakter |

### Rules

- Pada form Catatan Harian, `content` **opsional**. Kosong atau hanya spasi berarti hanya mood yang disimpan.
- `content` maksimal 5000 karakter. Pesan: `Jurnal maksimal 5000 karakter`.
- Database menolak jurnal kosong atau lebih dari 5000 karakter (`journals_content_check`), sehingga jurnal kosong tidak pernah tersimpan sebagai baris.

### Valid Example

{
  "content": "Hari ini saya merasa cukup baik."
}

### Example — Content Kosong

{
  "content": ""
}

Expected result: mood tetap disimpan, jurnal tidak dibuat.

### Invalid Example — Melebihi Batas Karakter

{
  "content": "Isi jurnal yang melebihi batas karakter yang ditentukan sistem..."
}

Expected result: sistem menolak input dan menampilkan pesan validasi.

## 4.2 Catatan Harian (mood + jurnal)

Mood dan jurnal diisi dalam satu form dan disimpan sekaligus lewat fungsi database `save_daily_entry(p_mood, p_content)`.

- `mood` wajib, bilangan bulat 1–5.
- `content` opsional, maksimal 5000 karakter.
- Validasi dijalankan dua kali: di form (pesan per field, semua error tampil sekaligus) dan di database.
- Penyimpanan bersifat atomik: bila salah satu gagal, tidak ada data yang tersimpan.

---

# 5. Validation Error Response

Apabila input tidak memenuhi aturan validasi, sistem harus memberikan response yang menunjukkan field yang bermasalah.

### Example

{
  "valid": false,
  "errors": {
    "email": "Format email tidak valid"
  }
}

### Multiple Validation Errors

{
  "valid": false,
  "errors": {
    "name": "Field name wajib diisi",
    "email": "Format email tidak valid",
    "password": "Field password wajib diisi"
  }
}

---

# 6. Implementation Notes

- Validation harus diterapkan pada frontend dan backend.
- Validation logic harus mengikuti aturan yang didefinisikan dalam dokumen ini.
- Validation tidak mencakup pemeriksaan credentials pengguna.
- Validation tidak mencakup pemeriksaan role atau hak akses pengguna.
- Authentication dan Role-Based Access diuji melalui `TEST_CASES.md` dan memiliki flow masing-masing.
- Test case dan hasil pengujian tidak didefinisikan ulang dalam dokumen ini.
- Batas maksimum karakter journal harus mengikuti nilai yang ditentukan pada implementasi/requirement sistem.