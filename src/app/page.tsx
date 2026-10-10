import Link from "next/link";

const moods = [
  { face: "😞", label: "Sangat buruk" },
  { face: "😕", label: "Buruk" },
  { face: "😐", label: "Biasa" },
  { face: "🙂", label: "Baik" },
  { face: "😄", label: "Sangat baik" },
];

const steps = [
  { title: "Catat", desc: "Pilih mood harian (skala 1–5) dan tulis jurnal singkat. Cukup satu menit." },
  { title: "Pahami", desc: "AI (IndoBERT) membaca sentimen jurnalmu dan menampilkan tren wellbeing dari minggu ke minggu." },
  { title: "Didukung", desc: "Unit konseling melihat tren kampus secara anonim untuk merancang dukungan yang lebih tepat waktu." },
];

const features = [
  {
    title: "Mood Tracker & Jurnal",
    desc: "Catat mood dan tulis jurnal secara cepat dan privat, kapan pun kamu butuh.",
    icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-3.5-7.5s1.2 2 3.5 2 3.5-2 3.5-2M9 9.5h.01M15 9.5h.01",
  },
  {
    title: "AI Sentiment Analysis",
    desc: "Analisis sentimen berbahasa Indonesia membantumu mengenali pola emosimu sendiri.",
    icon: "M4 19V5m0 14h16M8 15l3-4 3 2 4-6",
  },
  {
    title: "Privasi Terjaga",
    desc: "Identitas dan isi jurnalmu tidak pernah terlihat oleh pihak kampus.",
    icon: "M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-4",
  },
];

const campusSees = ["Rata-rata mood mingguan seluruh kampus", "Persentase sentimen positif, netral, dan negatif", "Jumlah mahasiswa aktif per minggu"];
const campusNeverSees = ["Nama, email, atau identitasmu", "Isi jurnal pribadimu", "Data minggu dengan kurang dari 5 mahasiswa"];

function Icon({ d, className = "" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <a href="#konten" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 bg-white px-4 py-2 rounded-md">
        Lewati ke konten
      </a>

      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur border-b border-brand-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-8 h-16">
          <Link href="/" className="font-serif text-2xl font-semibold text-brand-900">Instride</Link>
          <nav aria-label="Navigasi utama" className="flex items-center gap-2 sm:gap-6 text-sm font-medium">
            <a href="#cara-kerja" className="hidden sm:inline text-muted hover:text-ink">Cara Kerja</a>
            <a href="#privasi" className="hidden sm:inline text-muted hover:text-ink">Privasi</a>
            {/* /login & /register dibuat di Issue #7 */}
            <Link href="/login" className="px-4 py-2 rounded-full border border-brand-700 text-brand-700 hover:bg-brand-50">
              Masuk
            </Link>
          </nav>
        </div>
      </header>

      <main id="konten">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden="true" className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-brand-100 blur-3xl opacity-70" />
          <div aria-hidden="true" className="absolute -bottom-40 -left-24 w-[22rem] h-[22rem] rounded-full bg-brand-50 blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-24 grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <p className="inline-block text-xs font-semibold tracking-wider uppercase text-brand-700 bg-brand-50 rounded-full px-3 py-1">
                Untuk mahasiswa & unit konseling
              </p>
              <h1 className="mt-5 font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold leading-tight text-ink text-balance">
                {/* tanda hubung tak terputus agar "wellbeing-mu" tidak terpotong di akhir baris */}
                Pantau wellbeing‑mu, mulai dari hari ini
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted max-w-xl">
                Catat mood dan jurnal harian, pahami kondisi emosionalmu lewat AI, dan bantu kampus memberi
                dukungan yang lebih proaktif — tanpa mengorbankan privasimu.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="px-6 py-3 rounded-full bg-brand-700 text-white font-semibold hover:bg-brand-900 transition-colors">
                  Mulai Sekarang
                </Link>
                <a href="#cara-kerja" className="px-6 py-3 rounded-full text-brand-700 font-semibold hover:bg-brand-50">
                  Lihat cara kerjanya
                </a>
              </div>
            </div>

            {/* Pratinjau aplikasi (dekoratif) */}
            <div aria-hidden="true" className="relative mx-auto w-full max-w-md">
              <div className="bg-white rounded-3xl shadow-xl shadow-brand-900/10 border border-brand-100 p-6 sm:p-8">
                <p className="text-sm text-muted">Hari ini</p>
                <p className="mt-1 font-serif text-2xl text-ink">Bagaimana perasaanmu hari ini?</p>
                <div className="mt-6 grid grid-cols-5 gap-2">
                  {moods.map((m, i) => (
                    <div key={m.label}
                      className={`flex flex-col items-center gap-1 rounded-2xl py-3 text-2xl ${i === 3 ? "bg-brand-50 ring-2 ring-brand" : "bg-surface"}`}>
                      {m.face}
                      <span className="text-[10px] leading-tight text-muted text-center">{m.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl bg-surface p-4">
                  <p className="text-xs font-medium text-muted">Tren mood 7 hari</p>
                  <svg viewBox="0 0 200 50" preserveAspectRatio="none" className="mt-2 w-full h-12">
                    <polyline fill="none" stroke="#4FA7A1" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"
                      points="0,35 33,30 66,38 100,22 133,26 166,14 200,18" />
                  </svg>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-4 sm:-left-8 bg-white rounded-2xl shadow-lg border border-brand-100 px-4 py-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 grid place-items-center">
                  <Icon d={features[2].icon} className="w-5 h-5" />
                </span>
                <span className="text-sm font-medium text-ink">Jurnalmu hanya untukmu</span>
              </div>
            </div>
          </div>
        </section>

        {/* Cara kerja */}
        <section id="cara-kerja" className="scroll-mt-20 max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink">Cara kerja Instride</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="relative bg-white rounded-2xl border border-brand-100 p-6">
                <span className="w-9 h-9 rounded-full bg-brand-700 text-white font-semibold grid place-items-center">{i + 1}</span>
                <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{s.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Fitur */}
        <section className="bg-white border-y border-brand-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-20 grid gap-10 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title}>
                <span className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 grid place-items-center">
                  <Icon d={f.icon} className="w-6 h-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink">{f.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Privasi */}
        <section id="privasi" className="scroll-mt-20 max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
          <div className="rounded-3xl bg-brand-900 text-white p-8 sm:p-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold">Privasimu adalah prioritas</h2>
            <p className="mt-4 max-w-2xl text-brand-100 leading-relaxed">
              Kampus hanya melihat gambaran besar. Data dikumpulkan secara agregat dan anonim, dan aturan aksesnya
              ditegakkan langsung di database.
            </p>
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="font-semibold">Yang dilihat unit konseling</h3>
                <ul className="mt-4 space-y-3">
                  {campusSees.map((t) => (
                    <li key={t} className="flex gap-3 text-brand-100">
                      <Icon d="M5 12l5 5L20 7" className="w-5 h-5 shrink-0 text-brand-100" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Yang tidak pernah dilihat</h3>
                <ul className="mt-4 space-y-3">
                  {campusNeverSees.map((t) => (
                    <li key={t} className="flex gap-3 text-brand-100">
                      <Icon d="M6 6l12 12M18 6 6 18" className="w-5 h-5 shrink-0 text-brand-100" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Bantuan */}
        <section aria-labelledby="bantuan" className="max-w-6xl mx-auto px-4 sm:px-8 pb-16 sm:pb-20">
          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6 sm:flex sm:items-center sm:justify-between gap-6">
            <div>
              <h2 id="bantuan" className="font-semibold text-ink">Butuh bantuan sekarang?</h2>
              <p className="mt-1 text-muted">
                Instride bukan pengganti tenaga profesional. Layanan Healing119 Kemenkes gratis dan rahasia.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-3 shrink-0">
              <a href="tel:119" className="px-5 py-2.5 rounded-full bg-brand-700 text-white font-semibold hover:bg-brand-900">
                Telepon 119 ext. 8
              </a>
              <a href="https://healing119.id" target="_blank" rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-full border border-brand-700 text-brand-700 font-semibold hover:bg-white">
                healing119.id
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-brand-100 py-8 text-center text-sm text-muted">
        Instride · Senior Project DTETI UGM 2026
      </footer>
    </>
  );
}
