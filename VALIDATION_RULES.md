# Instride Validation Rules

Dokumen ini mendefinisikan aturan validasi input untuk fitur
Authentication, Mood Tracker, dan Journal pada aplikasi Instride.

Validasi harus diterapkan pada sisi frontend dan backend.

---

# 1. Authentication

## 1.1 Register

| Field | Required | Validation |
|---|---|---|
| `name` | Yes | Tidak boleh kosong |
| `email` | Yes | Tidak boleh kosong dan harus memiliki format email yang valid |
| `password` | Yes | Tidak boleh kosong |

### Rules

- Semua field wajib diisi.
- Email harus memiliki format email yang valid.
- Password tidak boleh kosong.
- Sistem harus menolak request apabila data wajib tidak tersedia.

### Example: Valid

```json
{
  "name": "Nama Mahasiswa",
  "email": "mahasiswa@example.com",
  "password": "password123"
}