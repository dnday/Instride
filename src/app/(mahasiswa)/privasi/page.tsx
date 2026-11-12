import Link from "next/link";

import { StudentPage } from "@/components/StudentShell";

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "Data yang kami kumpulkan",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Nama dan email untuk akunmu.</li>
        <li>Skor mood harian (1–5) dan isi jurnal yang kamu tulis.</li>
        <li>Hasil analisis sentimen jurnal (positif, netral, atau negatif).</li>
      </ul>
    ),
  },
  {
    title: "Mengapa data ini sensitif",
    body: (
      <p>
        Mood dan jurnal menggambarkan kondisi kesehatan mentalmu, sehingga termasuk <strong>data pribadi yang bersifat
        spesifik</strong> (data dan informasi kesehatan) menurut UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.
        Karena itu kami memprosesnya hanya dengan persetujuan eksplisit yang kamu berikan saat mendaftar.
      </p>
    ),
  },
  {
    title: "Untuk apa data dipakai",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Menampilkan riwayat dan tren mood untukmu sendiri.</li>
        <li>Menganalisis sentimen jurnal dengan model IndoBERT. Hanya teks jurnal yang dikirim ke layanan analisis, tanpa nama atau email.</li>
        <li>Menyusun statistik kampus yang anonim untuk unit konseling.</li>
      </ul>
    ),
  },
  {
    title: "Yang dilihat kampus",
    body: (
      <p>
        Unit konseling hanya melihat angka agregat per minggu: rata-rata mood, persentase sentimen, dan jumlah mahasiswa
        aktif. Nama, email, dan isi jurnal tidak pernah ditampilkan. Minggu atau angka yang berasal dari{" "}
        <strong>kurang dari 10 mahasiswa</strong> disembunyikan agar tidak ada yang bisa dikenali, mengikuti praktik
        penekanan sel kecil pada statistik kesehatan publik. Aturan ini ditegakkan langsung di database.
      </p>
    ),
  },
  {
    title: "Pihak pemroses data",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Supabase: penyimpanan database dan autentikasi.</li>
        <li>Hugging Face: menjalankan model analisis sentimen (menerima teks jurnal tanpa identitas).</li>
        <li>GitHub Pages: hosting halaman aplikasi (tidak menyimpan data jurnal).</li>
        <li>
          Fitur Dikte suara (opsional) memakai pengenalan suara bawaan browser. Di Chrome dan Edge, rekaman suaramu
          diproses oleh layanan pengenalan suara Google atau Microsoft. Jika tidak ingin, cukup ketik jurnalmu.
        </li>
      </ul>
    ),
  },
  {
    title: "Hakmu",
    body: (
      <p>
        Kamu dapat melihat seluruh catatanmu di halaman <Link href="/riwayat" className="font-semibold text-brand-700 underline">Riwayat</Link>,
        mengubah nama di <Link href="/profil" className="font-semibold text-brand-700 underline">Profil</Link>, serta
        menghapus semua mood dan jurnal atau menghapus akun beserta seluruh datanya kapan saja dari halaman Profil.
        Penghapusan berlaku permanen. Data disimpan sampai kamu menghapusnya.
      </p>
    ),
  },
  {
    title: "Batasan layanan",
    body: (
      <p>
        Instride adalah alat bantu refleksi, bukan alat diagnosis atau pengganti layanan psikolog dan psikiater. Skor
        mood dan sentimen bukan hasil pemeriksaan klinis. Jika kamu dalam kondisi darurat, hubungi layanan di halaman{" "}
        <Link href="/bantuan" className="font-semibold text-brand-700 underline">Bantuan</Link>.
      </p>
    ),
  },
];

// Halaman publik: ditautkan dari formulir pendaftaran sebelum akun dibuat
export default function PrivasiPage() {
  return (
    <StudentPage title="Kebijakan Privasi" intro="Bagaimana Instride memproses data mood dan jurnalmu.">
      <div className="card space-y-6 text-ink leading-relaxed">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-semibold">{s.title}</h2>
            <div className="mt-2">{s.body}</div>
          </section>
        ))}
      </div>
    </StudentPage>
  );
}
