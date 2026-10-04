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
| `name` | Yes | Tidak boleh kosong |
| `email` | Yes | Tidak boleh kosong dan harus memiliki format email yang valid |
| `password` | Yes | Tidak boleh kosong |

### Rules

- `name` wajib diisi.
- `name` tidak boleh kosong.
- `email` wajib diisi.
- `email` tidak boleh kosong.
- `email` harus memiliki format email yang valid.
- `password` wajib diisi.
- `password` tidak boleh kosong.
- Sistem harus menolak input apabila salah satu field wajib tidak tersedia atau kosong.

### Valid Example

{
  "name": "Nama Mahasiswa",
  "email": "mahasiswa@example.com",
  "password": "password123"
}