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

    {
      "name": "Nama Mahasiswa",
      "email": "mahasiswa@example.com",
      "password": "password123"
    }

**Validation**

- `name` wajib diisi.
- `email` wajib diisi.
- `email` harus memiliki format email yang valid.
- `password` wajib diisi.

---

### 1.2 Login

**Endpoint**

`POST /api/auth/login`

**Description**

Melakukan login pengguna ke dalam sistem.

**Request Body**

    {
      "email": "mahasiswa@example.com",
      "password": "password123"
    }

**Validation**

- `email` wajib diisi.
- `email` harus memiliki format email yang valid.
- `password` wajib diisi.

---

## 2. Mood Tracker

Mood Tracker digunakan untuk mencatat mood mahasiswa.

### 2.1 Create Mood

**Endpoint**

`POST /api/moods`

**Description**

Menyimpan data mood mahasiswa.

**Request Body**

    {
      "mood": 4
    }

**Validation**

- `mood` wajib diisi.
- Nilai `mood` harus berada pada rentang `1–5`.

---

### 2.2 Get Mood

**Endpoint**

`GET /api/moods`

**Description**

Mengambil data mood mahasiswa.

---

## 3. Journal

Journal digunakan untuk menyimpan catatan harian mahasiswa.

### 3.1 Create Journal

**Endpoint**

`POST /api/journals`

**Description**

Menyimpan journal mahasiswa.

**Request Body**

    {
      "content": "Hari ini saya merasa cukup baik."
    }

**Validation**

- `content` wajib diisi.
- `content` tidak boleh kosong.
- `content` tidak boleh melebihi batas karakter yang telah ditentukan.

---

### 3.2 Get Journal

**Endpoint**

`GET /api/journals`

**Description**

Mengambil data journal mahasiswa.

---

## 4. Dashboard

Dashboard digunakan untuk menampilkan data wellbeing berdasarkan
kebutuhan pengguna.

### 4.1 Personal Dashboard

Personal Dashboard digunakan oleh mahasiswa untuk melihat data
wellbeing pribadi.

**Access Role**

`mahasiswa`

Data yang digunakan berasal dari data mood dan journal mahasiswa.

---

### 4.2 Campus Dashboard

Campus Dashboard digunakan oleh konselor untuk melihat data wellbeing
mahasiswa dalam bentuk agregat.

**Access Role**

`konselor`

Mahasiswa tidak diperbolehkan mengakses Campus Dashboard.

---

## 5. Authentication and Authorization

### 5.1 Authentication

Authentication digunakan untuk memastikan pengguna dapat melakukan
register dan login ke dalam sistem.

Setelah login berhasil, sistem melakukan pengecekan role pengguna.

Role yang digunakan:

- `mahasiswa`
- `konselor`

---

### 5.2 Authorization

Authorization digunakan untuk menentukan akses pengguna berdasarkan
role.

Aturan akses:

| Role | Personal Dashboard | Campus Dashboard |
|------|--------------------|-------------------|
| `mahasiswa` | Diizinkan | Ditolak |
| `konselor` | - | Diizinkan |

---

## 6. Validation

Validation API mengikuti aturan yang didefinisikan pada
`VALIDATION_RULES.md`.

Validation mencakup:

- Register
- Login
- Mood Tracker
- Journal

Input yang tidak memenuhi validation rules harus ditolak oleh sistem.

---

## 7. Authentication Requirement

Endpoint yang membutuhkan pengguna terautentikasi hanya dapat
digunakan setelah pengguna berhasil login.

Data mood dan journal yang bersifat personal harus dikaitkan dengan
pengguna yang sedang login.

---

## 8. API Endpoint Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register pengguna |
| `POST` | `/api/auth/login` | Login pengguna |
| `POST` | `/api/moods` | Menyimpan mood |
| `GET` | `/api/moods` | Mengambil data mood |
| `POST` | `/api/journals` | Menyimpan journal |
| `GET` | `/api/journals` | Mengambil data journal |

---

## 9. Implementation Notes

- Authentication direncanakan menggunakan Supabase Auth.
- Role digunakan untuk membedakan akses `mahasiswa` dan `konselor`.
- Validation harus mengikuti aturan pada `VALIDATION_RULES.md`.
- Pengujian endpoint dilakukan berdasarkan test case pada
  `TEST_CASES.md`.
- Test case tetap berstatus `NOT RUN` sampai implementasi benar-benar
  tersedia dan pengujian telah dilakukan.
