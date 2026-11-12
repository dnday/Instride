import { StudentPage } from "@/components/StudentShell";

const TIPS = [
  {
    title: "Mengelola stres akademik",
    points: [
      "Pecah tugas besar menjadi langkah 25–30 menit, lalu istirahat 5 menit.",
      "Tulis tiga prioritas hari ini; sisanya boleh menunggu besok.",
      "Tidur 7–8 jam lebih membantu daripada begadang sebelum ujian.",
    ],
  },
  {
    title: "Teknik relaksasi sederhana",
    points: [
      "Napas 4-7-8: tarik 4 detik, tahan 7 detik, buang 8 detik, ulangi 4 kali.",
      "Grounding 5-4-3-2-1: sebut 5 hal yang terlihat, 4 terasa, 3 terdengar, 2 tercium, 1 terkecap.",
      "Jalan kaki 10 menit tanpa ponsel di sekitar kampus.",
    ],
  },
  {
    title: "Kapan perlu bantuan profesional",
    points: [
      "Sedih, cemas, atau hampa hampir setiap hari selama dua minggu atau lebih.",
      "Sulit tidur, makan, atau kuliah seperti biasanya.",
      "Muncul pikiran menyakiti diri: segera hubungi layanan di bawah, jangan menunggu.",
    ],
  },
];

const CONTACTS = [
  { name: "Layanan SEJIWA Kemenkes", detail: "Konseling psikologi gratis, 24 jam", action: "119 ext. 8", href: "tel:119" },
  { name: "Panggilan darurat nasional", detail: "Kondisi yang mengancam keselamatan", action: "112", href: "tel:112" },
];

// Halaman statis & publik: tidak bergantung pada login maupun hasil analisis sentimen (FR 9)
export default function BantuanPage() {
  return (
    <StudentPage title="Sumber Daya & Bantuan" intro="Tips wellbeing dan kontak yang bisa dihubungi kapan saja.">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIPS.map((t) => (
          <section key={t.title} className="card">
            <h2 className="font-semibold text-ink">{t.title}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
              {t.points.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </section>
        ))}
      </div>

      <section className="card">
        <h2 className="font-semibold text-ink">Butuh bantuan segera?</h2>
        <ul className="mt-2 divide-y divide-brand-100">
          {CONTACTS.map((c) => (
            <li key={c.name} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span>
                <span className="block font-medium text-ink">{c.name}</span>
                <span className="block text-sm text-muted">{c.detail}</span>
              </span>
              <a href={c.href} className="btn-ghost">{c.action}</a>
            </li>
          ))}
          <li className="py-3">
            <span className="block font-medium text-ink">Unit konseling kampus</span>
            <span className="block text-sm text-muted">
              Hubungi layanan konseling fakultas atau pusat kesehatan mahasiswa di kampusmu untuk membuat janji temu.
            </span>
          </li>
        </ul>
      </section>

      <p className="text-sm text-muted">
        Instride adalah alat bantu refleksi, bukan pengganti diagnosis atau layanan psikolog profesional.
      </p>
    </StudentPage>
  );
}
