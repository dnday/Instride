# Instride Test Cases

Dokumen ini berisi test case untuk pengujian fitur Authentication, Role-Based Access, Mood Tracker, dan Journal pada aplikasi Instride.

Status pengujian:

- PASS = Test berhasil sesuai expected result
- FAIL = Test tidak sesuai expected result
- NOT RUN = Test belum dijalankan

---

# 1. Authentication

## TC-AUTH-001 — Register dengan data valid

| Field | Value |
|---|---|
| Test ID | TC-AUTH-001 |
| Feature | Register |
| Precondition | User belum memiliki akun |
| Input | Name valid, email valid, password valid |
| Expected Result | Akun berhasil dibuat |
| Status | NOT RUN |

---

## TC-AUTH-002 — Register dengan name kosong

| Field | Value |
|---|---|
| Test ID | TC-AUTH-002 |
| Feature | Register Validation |
| Precondition | User berada pada halaman Register |
| Input | Name kosong, email valid, password valid |
| Expected Result | Sistem menolak input dan menampilkan validation error pada field `name` |
| Status | NOT RUN |

---

## TC-AUTH-003 — Register dengan email kosong

| Field | Value |
|---|---|
| Test ID | TC-AUTH-003 |
| Feature | Register Validation |
| Precondition | User berada pada halaman Register |
| Input | Name valid, email kosong, password valid |
| Expected Result | Sistem menolak input dan menampilkan validation error pada field `email` |
| Status | NOT RUN |

---

## TC-AUTH-004 — Register dengan format email tidak valid

| Field | Value |
|---|---|
| Test ID | TC-AUTH-004 |
| Feature | Register Validation |
| Precondition | User berada pada halaman Register |
| Input | Name valid, email dengan format tidak valid, password valid |
| Expected Result | Sistem menolak input dan menampilkan validation error pada field `email` |
| Status | NOT RUN |

---

## TC-AUTH-005 — Register dengan password kosong

| Field | Value |
|---|---|
| Test ID | TC-AUTH-005 |
| Feature | Register Validation |
| Precondition | User berada pada halaman Register |
| Input | Name valid, email valid, password kosong |
| Expected Result | Sistem menolak input dan menampilkan validation error pada field `password` |
| Status | NOT RUN |

---

## TC-AUTH-006 — Login dengan credentials valid

| Field | Value |
|---|---|
| Test ID | TC-AUTH-006 |
| Feature | Login |
| Precondition | User telah memiliki akun |
| Input | Email dan password yang benar |
| Expected Result | User berhasil login dan session dibuat |
| Status | NOT RUN |

---

## TC-AUTH-007 — Login dengan email kosong

| Field | Value |
|---|---|
| Test ID | TC-AUTH-007 |
| Feature | Login Validation |
| Precondition | User berada pada halaman Login |
| Input | Email kosong, password valid |
| Expected Result | Sistem menolak input dan menampilkan validation error pada field `email` |
| Status | NOT RUN |

---

## TC-AUTH-008 — Login dengan format email tidak valid

| Field | Value |
|---|---|
| Test ID | TC-AUTH-008 |
| Feature | Login Validation |
| Precondition | User berada pada halaman Login |
| Input | Email dengan format tidak valid, password valid |
| Expected Result | Sistem menolak input dan menampilkan validation error pada field `email` |
| Status | NOT RUN |

---

## TC-AUTH-009 — Login dengan password kosong

| Field | Value |
|---|---|
| Test ID | TC-AUTH-009 |
| Feature | Login Validation |
| Precondition | User berada pada halaman Login |
| Input | Email valid, password kosong |
| Expected Result | Sistem menolak input dan menampilkan validation error pada field `password` |
| Status | NOT RUN |

---

## TC-AUTH-010 — Login dengan password salah

| Field | Value |
|---|---|
| Test ID | TC-AUTH-010 |
| Feature | Login Authentication |
| Precondition | User telah memiliki akun |
| Input | Email benar, password salah |
| Expected Result | Login ditolak dan sistem menampilkan pesan error |
| Status | NOT RUN |

---

## TC-AUTH-011 — Login dengan email yang tidak terdaftar

| Field | Value |
|---|---|
| Test ID | TC-AUTH-011 |
| Feature | Login Authentication |
| Precondition | Email belum terdaftar |
| Input | Email yang tidak terdaftar dan password |
| Expected Result | Login ditolak dan sistem menampilkan pesan error |
| Status | NOT RUN |

---

# 2. Role-Based Access

## TC-RBAC-001 — Login sebagai mahasiswa

| Field | Value |
|---|---|
| Test ID | TC-RBAC-001 |
| Feature | Role-Based Access |
| Precondition | Akun mahasiswa telah terdaftar |
| Input | Login menggunakan akun mahasiswa |
| Expected Result | User berhasil login dengan role mahasiswa |
| Status | NOT RUN |

---

## TC-RBAC-002 — Login sebagai konselor/admin

| Field | Value |
|---|---|
| Test ID | TC-RBAC-002 |
| Feature | Role-Based Access |
| Precondition | Akun konselor/admin telah terdaftar |
| Input | Login menggunakan akun konselor/admin |
| Expected Result | User berhasil login dengan role konselor/admin |
| Status | NOT RUN |

---

## TC-RBAC-003 — Mahasiswa mengakses Campus Dashboard

| Field | Value |
|---|---|
| Test ID | TC-RBAC-003 |
| Feature | Role-Based Access |
| Precondition | User telah login sebagai mahasiswa |
| Input | Mahasiswa mencoba mengakses Campus Dashboard |
| Expected Result | Akses ditolak |
| Status | NOT RUN |

---

## TC-RBAC-004 — Konselor/admin mengakses Campus Dashboard

| Field | Value |
|---|---|
| Test ID | TC-RBAC-004 |
| Feature | Role-Based Access |
| Precondition | User telah login sebagai konselor/admin |
| Input | User mengakses Campus Dashboard |
| Expected Result | Akses diberikan dan Campus Dashboard ditampilkan |
| Status | NOT RUN |

---

# 3. Mood Tracker

## TC-MOOD-001 — Membuat mood dengan nilai valid

| Field | Value |
|---|---|
| Test ID | TC-MOOD-001 |
| Feature | Mood Tracker |
| Precondition | User telah login |
| Input | Mood = 1–5 |
| Expected Result | Mood berhasil disimpan |
| Status | NOT RUN |

---

## TC-MOOD-002 — Membuat mood tanpa nilai

| Field | Value |
|---|---|
| Test ID | TC-MOOD-002 |
| Feature | Mood Validation |
| Precondition | User telah login |
| Input | Mood kosong/tidak tersedia |
| Expected Result | Sistem menolak input dan menampilkan validation error |
| Status | NOT RUN |

---

## TC-MOOD-003 — Membuat mood di luar rentang

| Field | Value |
|---|---|
| Test ID | TC-MOOD-003 |
| Feature | Mood Validation |
| Precondition | User telah login |
| Input | Mood < 1 atau > 5 |
| Expected Result | Sistem menolak input dan menampilkan validation error |
| Status | NOT RUN |

---

# 4. Journal

## TC-JOURNAL-001 — Membuat jurnal dengan data valid

| Field | Value |
|---|---|
| Test ID | TC-JOURNAL-001 |
| Feature | Journal |
| Precondition | User telah login |
| Input | Isi jurnal yang valid dan tidak melebihi batas karakter |
| Expected Result | Jurnal berhasil disimpan |
| Status | NOT RUN |

---

## TC-JOURNAL-002 — Membuat jurnal kosong

| Field | Value |
|---|---|
| Test ID | TC-JOURNAL-002 |
| Feature | Journal Validation |
| Precondition | User telah login |
| Input | Isi jurnal kosong/tidak tersedia |
| Expected Result | Sistem menolak input dan menampilkan validation error |
| Status | NOT RUN |

---

## TC-JOURNAL-003 — Membuat jurnal melebihi batas karakter

| Field | Value |
|---|---|
| Test ID | TC-JOURNAL-003 |
| Feature | Journal Validation |
| Precondition | User telah login |
| Input | Isi jurnal melebihi batas karakter yang ditentukan sistem |
| Expected Result | Sistem menolak input dan menampilkan validation error |
| Status | NOT RUN |

---

# 5. Test Execution Summary

| Test ID | Status | Actual Result | Notes |
|---|---|---|---|
| TC-AUTH-001 | NOT RUN | - | - |
| TC-AUTH-002 | NOT RUN | - | - |
| TC-AUTH-003 | NOT RUN | - | - |
| TC-AUTH-004 | NOT RUN | - | - |
| TC-AUTH-005 | NOT RUN | - | - |
| TC-AUTH-006 | NOT RUN | - | - |
| TC-AUTH-007 | NOT RUN | - | - |
| TC-AUTH-008 | NOT RUN | - | - |
| TC-AUTH-009 | NOT RUN | - | - |
| TC-AUTH-010 | NOT RUN | - | - |
| TC-AUTH-011 | NOT RUN | - | - |
| TC-RBAC-001 | NOT RUN | - | - |
| TC-RBAC-002 | NOT RUN | - | - |
| TC-RBAC-003 | NOT RUN | - | - |
| TC-RBAC-004 | NOT RUN | - | - |
| TC-MOOD-001 | NOT RUN | - | - |
| TC-MOOD-002 | NOT RUN | - | - |
| TC-MOOD-003 | NOT RUN | - | - |
| TC-JOURNAL-001 | NOT RUN | - | - |
| TC-JOURNAL-002 | NOT RUN | - | - |
| TC-JOURNAL-003 | NOT RUN | - | - |
