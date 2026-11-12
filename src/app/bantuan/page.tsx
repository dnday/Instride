import { BreathingExercise, GroundingExercise } from "@/components/CalmTools";
import { StudentNav } from "@/components/StudentShell";

const ICON = {
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z",
  alert: "M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  campus: "M3 10 12 4l9 6M5 10v9h14v-9M9 19v-5h6v5",
};

const CONTACTS = [
  { name: "Layanan SEJIWA Kemenkes", detail: "Konseling psikologi gratis, 24 jam", action: "119 ext. 8", href: "tel:119", icon: ICON.phone, tone: "bg-brand-700" },
  { name: "Darurat nasional", detail: "Kondisi yang mengancam keselamatan", action: "112", href: "tel:112", icon: ICON.alert, tone: "bg-negative" },
];

const TIPS = [
  {
    title: "Saat tugas menumpuk",
    points: [
      "Pecah tugas besar menjadi langkah kecil yang bisa selesai dalam satu sesi.",
      "Tulis tiga prioritas hari ini; sisanya boleh menunggu besok.",
      "Minta bantuan teman atau dosen lebih awal, sebelum tenggat terasa menekan.",
    ],
  },
  {
    title: "Saat tidur berantakan",
    points: [
      "Usahakan jam tidur dan bangun yang sama setiap hari, termasuk akhir pekan.",
      "Jauhkan layar sekitar satu jam sebelum tidur.",
      "Begadang sebelum ujian cenderung menurunkan daya ingat, bukan menambahnya.",
    ],
  },
  {
    title: "Kapan perlu bantuan profesional",
    points: [
      "Sedih, cemas, atau hampa hampir setiap hari selama dua minggu atau lebih.",
      "Sulit tidur, makan, atau kuliah seperti biasanya.",
      "Muncul pikiran menyakiti diri: segera hubungi layanan di atas, jangan menunggu.",
    ],
  },
];

// Halaman publik: tidak bergantung pada login maupun hasil analisis sentimen (FR 9)
export default function BantuanPage() {
  return (
    <div className="min-h-screen bg-surface">
      <StudentNav />

      <header className="border-b border-brand-100 bg-brand-50">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-8 lg:grid-cols-12 lg:items-center">
          <div className="page-enter lg:col-span-6">
            <h1 className="font-serif text-4xl font-semibold leading-tight text-ink text-balance sm:text-5xl">
              Ambil jeda sebentar. Kamu tidak sendirian.
            </h1>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-ink">
              Latihan singkat untuk menenangkan diri, dan kontak yang bisa dihubungi kapan saja.
            </p>
          </div>

          <section aria-labelledby="darurat" className="lg:col-span-6">
            <div className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(31,78,75,0.06),0_12px_32px_-16px_rgba(31,78,75,0.28)] sm:p-6">
              <h2 id="darurat" className="font-serif text-xl font-semibold text-ink">Butuh bantuan sekarang?</h2>
              <p className="mt-1 text-sm text-ink">Gratis, rahasia, dan bisa dihubungi 24 jam.</p>
              <ul className="mt-4 divide-y divide-brand-100">
                {CONTACTS.map((c) => (
                  <li key={c.action}>
                    <a href={c.href} className="group flex min-h-16 items-center gap-4 py-3">
                      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white ${c.tone}`}>
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d={c.icon} />
                        </svg>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-ink">{c.name}</span>
                        <span className="block text-sm text-muted">{c.detail}</span>
                      </span>
                      <span className="tnum font-serif text-xl font-semibold text-ink underline decoration-brand-100 decoration-2 underline-offset-4 transition-colors duration-150 group-hover:decoration-brand-700">
                        {c.action}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex items-start gap-2 text-sm text-muted">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={ICON.campus} /></svg>
                Untuk janji temu, hubungi layanan konseling fakultas atau pusat kesehatan mahasiswa di kampusmu.
              </p>
            </div>
          </section>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-12 px-4 pb-24 pt-10 sm:px-8 sm:pb-16">
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <BreathingExercise />
          <GroundingExercise />
        </div>

        <section aria-labelledby="tips" className="grid gap-8 lg:grid-cols-12">
          <h2 id="tips" className="font-serif text-3xl font-semibold leading-tight text-ink lg:col-span-4">
            Untuk hari-hari yang berat
          </h2>
          <div className="space-y-8 lg:col-span-8">
            {TIPS.map((t) => (
              <div key={t.title}>
                <h3 className="text-lg font-semibold text-ink">{t.title}</h3>
                <ul className="mt-3 space-y-2 text-ink">
                  {t.points.map((p) => (
                    <li key={p} className="flex max-w-[65ch] gap-3 leading-relaxed">
                      <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-700" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <p className="text-sm text-muted">
          Instride adalah alat bantu refleksi, bukan pengganti diagnosis atau layanan psikolog profesional.
        </p>
      </main>
    </div>
  );
}
