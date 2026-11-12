import Link from "next/link";

const campusSees = ["Rata-rata mood mingguan seluruh kampus", "Persentase sentimen positif, netral, dan negatif", "Jumlah mahasiswa aktif per minggu"];
const campusNeverSees = ["Nama, email, atau identitasmu", "Isi jurnal pribadimu", "Data minggu dengan kurang dari 10 mahasiswa"];

const CHECK = "M5 12l5 5L20 7";
const CROSS = "M6 6l12 12M18 6 6 18";
const PHONE = "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z";

function Icon({ d, className = "" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/** Pemilih mood seperti di aplikasi: lingkaran 1–5, satu terpilih. */
function MoodRow({ active, small = false }: { active: number; small?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      {[1, 2, 3, 4, 5].map((v) => (
        <span key={v}
          className={`grid place-items-center rounded-full border font-semibold ${small ? "h-9 w-9 text-sm" : "h-10 w-10 sm:h-12 sm:w-12"} ${
            v === active ? "border-brand-700 bg-brand-700 text-white" : "border-brand-100 bg-white text-ink"
          }`}>
          {v}
        </span>
      ))}
    </div>
  );
}

function Sparkline({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 50" preserveAspectRatio="none" className={className} aria-hidden="true">
      <polyline fill="none" stroke="#2A7470" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round"
        strokeLinejoin="round" points="0,35 33,30 66,38 100,22 133,26 166,14 200,18" />
    </svg>
  );
}

const steps = [
  {
    title: "Catat mood dan jurnal",
    desc: "Pilih mood harian pada skala 1 sampai 5 lalu tulis jurnal singkat. Cukup satu menit.",
    label: "Contoh form mood: skala 1 sampai 5 dengan mood 4 terpilih",
    ui: (
      <>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Mood hari ini</p>
        <div className="mt-3"><MoodRow active={4} small /></div>
        <div className="mt-4 space-y-2">
          <span className="block h-2 w-full rounded-full bg-brand-100" />
          <span className="block h-2 w-2/3 rounded-full bg-brand-100" />
        </div>
      </>
    ),
  },
  {
    title: "Pahami pola emosimu",
    desc: "IndoBERT membaca sentimen jurnalmu, lalu dashboard menampilkan tren mood dari minggu ke minggu.",
    label: "Contoh dashboard pribadi: sentimen jurnal positif dan grafik tren mood 7 hari",
    ui: (
      <>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Tren 7 hari</p>
          <span className="rounded-full border border-brand-100 bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-900">Positif</span>
        </div>
        <Sparkline className="mt-4 h-16 w-full" />
      </>
    ),
  },
  {
    title: "Dukungan dari kampus",
    desc: "Unit konseling melihat tren kampus secara anonim untuk merancang dukungan yang tepat waktu.",
    label: "Contoh dashboard kampus: distribusi sentimen agregat positif, netral, dan negatif",
    ui: (
      <>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Sentimen kampus minggu ini</p>
        <div className="mt-4 flex h-4 overflow-hidden rounded-full">
          <span className="w-[58%] bg-brand-700" />
          <span className="w-[27%] bg-[#9AA5A2]" />
          <span className="w-[15%] bg-negative" />
        </div>
        <div className="mt-3 flex justify-between text-xs font-medium text-ink">
          <span>Positif 58%</span><span>Netral 27%</span><span>Negatif 15%</span>
        </div>
      </>
    ),
  },
];

const riwayat = [
  { day: "Kamis, 12 November", mood: 4, sentiment: "Positif", w: "80%", cls: "border-brand-100 bg-brand-50 text-brand-900" },
  { day: "Rabu, 11 November", mood: 3, sentiment: "Netral", w: "55%", cls: "border-gray-200 bg-gray-50 text-gray-700" },
  { day: "Selasa, 10 November", mood: 2, sentiment: "Negatif", w: "70%", cls: "border-orange-100 bg-orange-50 text-negative" },
];

// Satu bagian per layar (hero = layar dikurangi nav 4rem); di ponsel bagian boleh tumbuh mengikuti isi.
const SCREEN = "min-h-svh flex flex-col justify-center py-16";

export default function Home() {
  return (
    <>
      <header className="nav sticky top-0 z-40 h-16 bg-surface/95 backdrop-blur border-b border-brand-100">
        <a href="#konten" className="skip-link sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 bg-white px-4 py-2 rounded-md">
          Lewati ke konten
        </a>
        <div className="wrap flex items-center justify-between h-full">
          <Link href="/" className="inline-flex min-h-11 items-center font-serif text-2xl font-semibold text-brand-900">Instride</Link>
          <nav aria-label="Navigasi utama" className="flex items-center gap-1 sm:gap-4 text-sm font-medium">
            <a href="#cara-kerja" className="hidden md:inline-flex min-h-11 items-center px-2 text-ink hover:text-brand-700">Cara kerja</a>
            <a href="#privasi" className="hidden md:inline-flex min-h-11 items-center px-2 text-ink hover:text-brand-700">Privasi</a>
            <Link href="/login" className="inline-flex min-h-11 items-center px-3 -mr-3 sm:mr-0 text-ink hover:text-brand-700">Masuk</Link>
            <Link href="/register" className="btn hidden sm:inline-flex">Mulai Sekarang</Link>
          </nav>
        </div>
      </header>

      <main id="konten">
        {/* Hero: sendirian di layar pertama */}
        <section data-enter className="hero-enter -mt-16 min-h-svh flex flex-col justify-center pt-28 pb-12">
          <div className="wrap grid gap-x-6 gap-y-12 lg:grid-cols-12 items-start">
            <div className="hero-text min-w-0 lg:col-span-6">
              <p className="text-xs font-semibold tracking-wider uppercase text-brand-700">Untuk mahasiswa dan unit konseling</p>
              <h1 className="mt-4 font-serif text-[2rem] sm:text-5xl lg:text-[3.5rem] font-semibold leading-tight text-ink text-balance">
                {/* tanda hubung tak terputus agar "wellbeing-mu" tidak terpotong di akhir baris */}
                Pantau wellbeing‑mu, mulai dari hari ini
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-ink max-w-xl">
                Catat mood dan jurnal harian dalam 1 menit, pahami pola emosimu lewat analisis sentimen berbahasa
                Indonesia, dan bantu kampus memberi dukungan lebih awal tanpa membuka identitasmu.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="btn">Mulai Sekarang</Link>
                <a href="#cara-kerja" className="btn-ghost">Lihat cara kerjanya</a>
              </div>
            </div>

            {/* Tampilan aplikasi yang sebenarnya: form mood + tren */}
            <div role="img" data-ui aria-label="Tampilan aplikasi Instride: form mood harian dengan mood 4 terpilih dan grafik tren mood 7 hari"
              className="min-w-0 lg:col-span-6 bg-white rounded-3xl border border-brand-100 shadow-xl shadow-brand-900/10 p-5 sm:p-8">
              <p className="text-sm font-medium text-muted">Hari ini</p>
              <p className="mt-1 font-serif text-2xl text-ink">Bagaimana perasaanmu hari ini?</p>
              <div className="mt-6"><MoodRow active={4} /></div>
              <div className="mt-6 rounded-2xl border border-brand-100 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Tren mood 7 hari</p>
                  <p className="text-sm font-semibold text-ink">3,8 / 5</p>
                </div>
                <Sparkline className="mt-3 h-16 w-full" />
              </div>
              <p className="mt-5 flex items-center gap-2 text-sm font-medium text-ink">
                <Icon d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-4" className="w-5 h-5 text-brand-700" />
                Jurnalmu hanya untukmu
              </p>
            </div>
          </div>
        </section>

        {/* Cara kerja */}
        <section id="cara-kerja" className={`${SCREEN} scroll-mt-16 bg-white border-y border-brand-100`}>
          <div className="wrap">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink">Cara kerja Instride</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink">
              Tiga langkah dari catatan harian sampai dukungan kampus.
            </p>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.title} className="flex flex-col rounded-2xl border border-brand-100 bg-surface p-5">
                  <div role="img" data-ui aria-label={s.label} className="rounded-xl border border-brand-100 bg-white p-4 h-40">
                    {s.ui}
                  </div>
                  <h3 className="mt-5 flex items-center gap-3 text-lg font-semibold text-ink">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-700 text-sm text-white">{i + 1}</span>
                    {s.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-ink">{s.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Privasi: pita gelap */}
        <section id="privasi" className={`${SCREEN} scroll-mt-16 bg-brand-900 text-white`}>
          <div className="wrap">
            <div className="grid gap-x-6 gap-y-10 lg:grid-cols-12 items-start">
              <div className="min-w-0 lg:col-span-6">
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold">Privasi jurnal mahasiswa</h2>
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-white">
                  Kampus hanya melihat gambaran besar. Data dikumpulkan secara agregat dan anonim, dan aturan aksesnya
                  ditegakkan langsung di database.
                </p>
              </div>
              {/* Diagram: banyak jurnal pribadi menjadi satu angka agregat */}
              <svg viewBox="0 0 520 170" role="img" className="min-w-0 w-full lg:col-span-6"
                aria-label="Diagram: jurnal pribadi banyak mahasiswa digabung menjadi statistik anonim sebelum sampai ke unit konseling">
                {[20, 65, 110].map((y) => (
                  <g key={y}>
                    <rect x="2" y={y} width="120" height="34" rx="10" fill="#2A7470" />
                    <rect x="16" y={y + 14} width="70" height="6" rx="3" fill="#CFE9E6" />
                    <path d={`M122 ${y + 17} C170 ${y + 17} 170 82 215 82`} fill="none" stroke="#4FA7A1" strokeWidth="2" />
                  </g>
                ))}
                <rect x="215" y="52" width="130" height="60" rx="14" fill="#F8FAFA" />
                <text x="280" y="78" textAnchor="middle" fontSize="13" fontWeight="600" fill="#1F4E4B">Agregat anonim</text>
                <text x="280" y="97" textAnchor="middle" fontSize="12" fill="#1F4E4B">min. 10 mahasiswa</text>
                <path d="M345 82 H395" fill="none" stroke="#4FA7A1" strokeWidth="2" />
                <rect x="395" y="52" width="122" height="60" rx="14" fill="#2A7470" />
                <rect x="412" y="88" width="14" height="12" rx="2" fill="#CFE9E6" />
                <rect x="432" y="76" width="14" height="24" rx="2" fill="#CFE9E6" />
                <rect x="452" y="66" width="14" height="34" rx="2" fill="#CFE9E6" />
                <rect x="472" y="80" width="14" height="20" rx="2" fill="#CFE9E6" />
              </svg>
            </div>
            <div className="mt-14 grid gap-x-6 gap-y-8 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold">Data yang dilihat unit konseling</h3>
                <ul className="mt-4 space-y-3">
                  {campusSees.map((t) => (
                    <li key={t} className="flex gap-3"><Icon d={CHECK} className="w-5 h-5 shrink-0 text-brand-100" /> {t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Data yang tidak pernah dilihat</h3>
                <ul className="mt-4 space-y-3">
                  {campusNeverSees.map((t) => (
                    <li key={t} className="flex gap-3"><Icon d={CROSS} className="w-5 h-5 shrink-0 text-brand-100" /> {t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Penutup: ajakan + bantuan + footer dalam satu layar */}
        <section aria-labelledby="mulai" className="min-h-svh grid pt-16 pb-8">
          <div className="wrap grid content-center">
            <div className="grid gap-x-6 gap-y-10 lg:grid-cols-12 items-start">
              <div className="min-w-0 lg:col-span-6">
                <h2 id="mulai" className="font-serif text-3xl sm:text-4xl font-semibold text-ink text-balance">
                  Catatan mood pertamamu selesai dalam 1 menit
                </h2>
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink">
                  Daftar dengan email kampus atau akun Google, lalu lihat riwayat dan trenmu tumbuh dari hari ke hari.
                </p>
                <div className="mt-8"><Link href="/register" className="btn">Mulai Sekarang</Link></div>
              </div>
              <div role="img" data-ui aria-label="Tampilan riwayat jurnal Instride: tiga catatan harian dengan mood dan label sentimen"
                className="min-w-0 lg:col-span-6 rounded-3xl border border-brand-100 bg-white p-5 sm:p-8 divide-y divide-brand-100">
                {riwayat.map((r) => (
                  <div key={r.day} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-brand-700 font-semibold text-brand-900">{r.mood}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink">{r.day}</span>
                      <span className="mt-2 block h-2 rounded-full bg-brand-100" style={{ width: r.w }} />
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${r.cls}`}>{r.sentiment}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 grid gap-x-6 gap-y-5 lg:grid-cols-12 items-center">
              <div className="lg:col-span-7">
                <h3 className="text-lg font-semibold text-ink">Bantuan psikologis 24 jam</h3>
                <p className="mt-1 text-ink">
                  Instride bukan pengganti tenaga profesional. Layanan Healing119 Kemenkes gratis dan rahasia.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:col-span-5 lg:justify-end">
                <a href="tel:119" className="btn-ghost"><Icon d={PHONE} className="w-4 h-4" />Telepon 119 ext. 8</a>
                <a href="https://healing119.id" target="_blank" rel="noopener noreferrer" className="btn-ghost">Buka healing119.id</a>
              </div>
            </div>
            <footer className="mt-10 text-sm text-muted">Instride · Senior Project DTETI UGM 2026</footer>
          </div>
        </section>
      </main>
    </>
  );
}
