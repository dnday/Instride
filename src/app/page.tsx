import Link from "next/link";

const features = [
  {
    title: "Mood Tracker & Jurnal",
    desc: "Catat mood harian (skala 1–5) dan tulis jurnal secara cepat dan privat.",
    icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-3.5-7.5s1.2 2 3.5 2 3.5-2 3.5-2M9 9.5h.01M15 9.5h.01",
  },
  {
    title: "AI Sentiment Analysis",
    desc: "Jurnalmu dianalisis IndoBERT untuk membantu memahami kondisi emosionalmu dari waktu ke waktu.",
    icon: "M4 19V5m0 14h16M8 15l3-4 3 2 4-6",
  },
  {
    title: "Privasi Terjaga",
    desc: "Kampus hanya melihat tren agregat & anonim — tidak pernah identitas atau isi jurnalmu.",
    icon: "M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-4",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8FAFA] text-gray-900">
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 bg-[#4FA7A1] text-white">
        <span className="text-lg font-bold">Instride</span>
        <nav className="flex gap-4 sm:gap-6 text-sm">
          <a href="#tentang" className="hover:underline">Tentang</a>
          {/* /login & /register dibuat di Issue #7 */}
          <Link href="/login" className="hover:underline">Masuk</Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8">
        <section className="py-16 sm:py-24 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Pantau Wellbeing-mu, Mulai dari Hari Ini
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            Instride membantu mahasiswa mencatat mood &amp; jurnal harian, memahami kondisi emosional lewat AI,
            dan membantu kampus memberi dukungan yang lebih proaktif — tanpa mengorbankan privasi.
          </p>
          <Link
            href="/register"
            className="inline-block mt-8 px-6 py-3 rounded-md bg-[#4FA7A1] text-white font-semibold uppercase tracking-wide text-sm hover:bg-[#3E8C87] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4FA7A1]"
          >
            Mulai Sekarang
          </Link>
        </section>

        <section id="tentang" className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-16 sm:pb-24">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-lg border p-6 text-center">
              <svg
                viewBox="0 0 24 24"
                className="w-10 h-10 mx-auto text-[#4FA7A1]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={f.icon} />
              </svg>
              <h2 className="mt-4 font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t py-6 text-center text-xs text-gray-500">
        Instride · Senior Project DTETI UGM 2026
      </footer>
    </div>
  );
}
