# Instride API Specification

Dokumen ini mendefinisikan rancangan endpoint API untuk aplikasi
Instride berdasarkan functional requirements dan pembagian tugas
pengembangan.

---

## 1. Authentication

Authentication digunakan untuk menangani proses registrasi dan login
pengguna.

Role yang digunakan dalam sistem:

- `mahasiswa`
- `konselor`

Implementasi authentication direncanakan menggunakan Supabase Auth.

---

### 1.1 Register

**Endpoint**

`POST /api/auth/register`

**Description**

Mendaftarkan pengguna baru ke dalam sistem.

**Request Body**

```json
{
  "name": "Nama Mahasiswa",
  "email": "mahasiswa@example.com",
  "password": "password123"
}