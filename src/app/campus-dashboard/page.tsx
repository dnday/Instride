"use client";

import { getSupabaseClient, SupabaseConfigError } from "@/lib/supabaseClient";
import Link from "next/link";
import { useEffect, useState } from "react";

type Stat = {
  period: string;
  average_mood: number | null;
  total_journals: number;
  active_students: number;
  positive_percentage: number | null;
  neutral_percentage: number | null;
  negative_percentage: number | null;
};

type State =
  | { status: "loading" }
  | { status: "error"; title: string; message: string; action?: { href: string; label: string } }
  | { status: "ready"; stats: Stat[] };

const SENTIMENT = [
  { key: "positive_percentage", label: "Positif", color: "#2A7470" },
  { key: "neutral_percentage", label: "Netral", color: "#9AA5A2" },
  { key: "negative_percentage", label: "Negatif", color: "#B4533A" },
] as const;

const fmtWeek = (iso: string) => {
  const start = new Date(iso);
  const end = new Date(start.getTime() + 6 * 864e5);
  const d = (x: Date, o: Intl.DateTimeFormatOptions) => x.toLocaleDateString("id-ID", o);
  return `${d(start, { day: "numeric", month: "short" })} – ${d(end, { day: "numeric", month: "short", year: "numeric" })}`;
};

export default function CampusDashboard() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (e) {
      return setState({
        status: "error",
        title: "Layanan belum dikonfigurasi",
        message: e instanceof SupabaseConfigError ? e.message : "Konfigurasi tidak valid.",
      });
    }

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user)
        return setState({
          status: "error",
          title: "Silakan masuk terlebih dahulu",
          message: "Campus Dashboard hanya dapat diakses oleh akun Unit Konseling.",
          action: { href: "/login", label: "Masuk" },
        });

      const { data: me } = await supabase.from("users").select("role").eq("user_id", auth.user.id).single();
      if (me?.role !== "konselor" && me?.role !== "admin")
        return setState({
          status: "error",
          title: "Akses khusus Unit Konseling",
          message: "Akunmu terdaftar sebagai mahasiswa. Jika kamu konselor, minta admin mengubah peran akunmu.",
          action: { href: "/", label: "Kembali ke beranda" },
        });

      const { data, error } = await supabase.rpc("campus_wellbeing_stats");
      if (error)
        return setState({ status: "error", title: "Gagal memuat data", message: `${error.message}. Coba muat ulang halaman.` });
      setState({ status: "ready", stats: data as Stat[] });
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-brand-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-8 h-16">
          <Link href="/" className="font-serif text-2xl font-semibold text-brand-900">
            Instride <span className="font-sans text-sm font-medium text-muted">Unit Konseling</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-muted hover:text-ink">Beranda</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">Campus Wellbeing Overview</h1>
          <p className="mt-1 text-muted">Tren wellbeing mahasiswa secara agregat dan anonim.</p>
        </div>

        {state.status === "loading" && <Skeleton />}
        {state.status === "error" && <Notice {...state} />}
        {state.status === "ready" && <Overview stats={state.stats} />}

        <p className="flex gap-2 text-xs text-muted">
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
          </svg>
          Data ditampilkan secara agregat &amp; anonim — tanpa identitas maupun isi jurnal mahasiswa. Periode dengan
          kurang dari 5 mahasiswa aktif tidak ditampilkan.
        </p>
      </main>
    </div>
  );
}

function Notice({ title, message, action }: { title: string; message: string; action?: { href: string; label: string } }) {
  return (
    <div role="alert" className="bg-white rounded-2xl border border-brand-100 p-8 text-center">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-muted max-w-md mx-auto">{message}</p>
      {action && (
        <Link href={action.href} className="inline-block mt-5 px-5 py-2.5 rounded-full bg-brand-700 text-white font-semibold hover:bg-brand-900">
          {action.label}
        </Link>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Memuat data" className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => <div key={i} className="h-28 bg-white rounded-2xl border border-brand-100" />)}
      </div>
      <div className="h-72 bg-white rounded-2xl border border-brand-100" />
    </div>
  );
}

function Overview({ stats }: { stats: Stat[] }) {
  if (stats.length === 0)
    return (
      <div className="bg-white rounded-2xl border border-brand-100 p-8 text-center">
        <h2 className="text-lg font-semibold text-ink">Belum cukup data untuk ditampilkan</h2>
        <p className="mt-2 text-muted max-w-lg mx-auto">
          Statistik muncul setelah minimal 5 mahasiswa mencatat mood atau jurnal dalam satu minggu. Batas ini menjaga
          agar tidak ada mahasiswa yang dapat dikenali dari data agregat.
        </p>
      </div>
    );

  const latest = stats[stats.length - 1];
  const prev = stats.length > 1 ? stats[stats.length - 2] : null;
  const delta =
    latest.average_mood != null && prev?.average_mood != null ? Number(latest.average_mood) - Number(prev.average_mood) : null;

  return (
    <>
      <p className="text-sm font-medium text-muted">Minggu {fmtWeek(latest.period)}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi label="Rata-rata mood kampus"
          value={latest.average_mood == null ? "—" : Number(latest.average_mood).toFixed(1)} unit="/ 5"
          note={delta == null ? "Belum ada pembanding minggu lalu" : `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta).toFixed(1)} dari minggu lalu`} />
        <Kpi label="Jurnal ditulis" value={String(latest.total_journals)} note="minggu ini" />
        <Kpi label="Mahasiswa aktif" value={String(latest.active_students)} note="mencatat mood atau jurnal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 bg-white rounded-2xl border border-brand-100 p-5 sm:p-6">
          <h2 className="font-semibold text-ink">Tren rata-rata mood mingguan</h2>
          <p className="text-sm text-muted">Skala 1 (sangat buruk) – 5 (sangat baik)</p>
          <TrendChart stats={stats} />
        </section>

        <section className="bg-white rounded-2xl border border-brand-100 p-5 sm:p-6">
          <h2 className="font-semibold text-ink">Distribusi sentimen jurnal</h2>
          <p className="text-sm text-muted">Hasil analisis AI minggu ini</p>
          {latest.positive_percentage == null ? (
            <p className="mt-6 text-sm text-muted">
              Data sentimen minggu ini belum mencapai 5 mahasiswa, sehingga belum ditampilkan.
            </p>
          ) : (
            <>
              <div className="mt-6 flex h-4 rounded-full overflow-hidden" role="img"
                aria-label={SENTIMENT.map((s) => `${s.label} ${Number(latest[s.key]).toFixed(0)}%`).join(", ")}>
                {SENTIMENT.map((s) => (
                  <div key={s.key} style={{ width: `${latest[s.key]}%`, background: s.color }} />
                ))}
              </div>
              <ul className="mt-5 space-y-3">
                {SENTIMENT.map((s) => (
                  <li key={s.key} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-ink">
                      <span className="w-3 h-3 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
                      {s.label}
                    </span>
                    <span className="font-semibold tabular-nums">{Number(latest[s.key] ?? 0).toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </>
  );
}

function Kpi({ label, value, unit, note }: { label: string; value: string; unit?: string; note: string }) {
  return (
    <div className="bg-white rounded-2xl border border-brand-100 p-5">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-2 text-4xl font-semibold text-ink tabular-nums">
        {value} {unit && <span className="text-lg font-medium text-muted">{unit}</span>}
      </p>
      <p className="mt-1 text-sm text-muted">{note}</p>
    </div>
  );
}

// ponytail: SVG sederhana; ganti ke Recharts setelah #14 menambahkannya
function TrendChart({ stats }: { stats: Stat[] }) {
  const points = stats.filter((s) => s.average_mood != null);
  if (points.length < 2)
    return <p className="mt-6 text-sm text-muted">Grafik tren muncul setelah ada data dari minimal 2 minggu.</p>;

  const W = 640, H = 240, L = 28, R = 24, T = 12, B = 28;
  const x = (i: number) => L + (i * (W - L - R)) / (points.length - 1);
  const y = (v: number) => T + ((5 - v) * (H - T - B)) / 4;
  const line = points.map((s, i) => `${x(i)},${y(Number(s.average_mood))}`).join(" ");
  const every = Math.ceil(points.length / 8); // maks ~8 label sumbu-x agar tidak bertumpuk
  const short = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full h-auto" role="img"
      aria-label={`Tren mood: ${points.map((s) => `${short(s.period)} ${Number(s.average_mood).toFixed(1)}`).join(", ")}`}>
      {[1, 2, 3, 4, 5].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#E6F2F1" />
          <text x={L - 10} y={y(v) + 4} fontSize="11" fill="#56625F" textAnchor="end">{v}</text>
        </g>
      ))}
      <polygon points={`${x(0)},${y(1)} ${line} ${x(points.length - 1)},${y(1)}`} fill="#4FA7A1" opacity="0.12" />
      <polyline fill="none" stroke="#2A7470" strokeWidth="2.5" strokeLinejoin="round" points={line} />
      {points.map((s, i) => (
        <g key={s.period}>
          <circle cx={x(i)} cy={y(Number(s.average_mood))} r="4" fill="#fff" stroke="#2A7470" strokeWidth="2">
            <title>{`${fmtWeek(s.period)}: ${Number(s.average_mood).toFixed(2)}`}</title>
          </circle>
          {i % every === 0 && (
            <text x={x(i)} y={H - 8} fontSize="11" fill="#56625F" textAnchor="middle">{short(s.period)}</text>
          )}
        </g>
      ))}
    </svg>
  );
}
