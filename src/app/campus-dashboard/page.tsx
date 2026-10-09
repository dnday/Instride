"use client";

import { getSupabaseClient, SupabaseConfigError } from "@/lib/supabaseClient";
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
  | { status: "error"; message: string }
  | { status: "ready"; stats: Stat[] };

const PRIMARY = "#4FA7A1";

export default function CampusDashboard() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (e) {
      if (e instanceof SupabaseConfigError) {
        return setState({ status: "error", message: e.message });
      }
      return setState({ status: "error", message: "Konfigurasi tidak valid." });
    }

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return setState({ status: "error", message: "Silakan login terlebih dahulu." });

      const { data: me } = await supabase.from("users").select("role").eq("user_id", auth.user.id).single();
      if (me?.role !== "konselor" && me?.role !== "admin")
        return setState({ status: "error", message: "Halaman ini hanya untuk Unit Konseling." });

      const { data, error } = await supabase.rpc("campus_wellbeing_stats");
      if (error) return setState({ status: "error", message: error.message });
      setState({ status: "ready", stats: data as Stat[] });
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFA] text-gray-900">
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 text-white" style={{ background: PRIMARY }}>
        <h1 className="font-semibold">Instride — Unit Konseling</h1>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-8 space-y-6">
        <h2 className="text-2xl font-semibold">Campus Wellbeing Overview</h2>

        {state.status === "loading" && <p>Memuat data…</p>}
        {state.status === "error" && <p className="text-red-600">{state.message}</p>}
        {state.status === "ready" && <Overview stats={state.stats} />}

        <p className="text-xs text-gray-500">
          *Data ditampilkan secara agregat &amp; anonim — tidak menampilkan identitas maupun isi jurnal pribadi
          mahasiswa. Periode dengan kurang dari 5 mahasiswa aktif tidak ditampilkan.
        </p>
      </main>
    </div>
  );
}

function Overview({ stats }: { stats: Stat[] }) {
  if (stats.length === 0) return <p>Belum ada data yang cukup untuk ditampilkan secara anonim.</p>;

  const latest = stats[stats.length - 1];
  const fmt = (v: number | null, suffix = "") => (v == null ? "—" : `${Number(v).toFixed(1)}${suffix}`);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card label="Rata-rata mood kampus" value={`${fmt(latest.average_mood)} / 5`} />
        <Card label="Total jurnal minggu ini" value={String(latest.total_journals)} />
        <Card label="Mahasiswa aktif minggu ini" value={String(latest.active_students)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <section className="md:col-span-2 bg-white rounded-lg border p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Tren mood komunitas (mingguan)</h3>
          <TrendChart stats={stats} />
        </section>
        <section className="bg-white rounded-lg border p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Distribusi sentimen minggu ini</h3>
          {latest.positive_percentage == null ? (
            <p className="text-sm text-gray-500">Data sentimen belum cukup.</p>
          ) : (
            <div className="space-y-3">
              <Bar label="Positif" value={latest.positive_percentage} color={PRIMARY} />
              <Bar label="Netral" value={latest.neutral_percentage ?? 0} color="#9CA3AF" />
              <Bar label="Negatif" value={latest.negative_percentage ?? 0} color="#E07A5F" />
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
      <p className="text-3xl font-semibold mt-1">{value}</p>
    </div>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{Number(value).toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded">
        <div className="h-2 rounded" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

// ponytail: SVG sederhana; ganti ke Recharts setelah #14 menambahkannya
function TrendChart({ stats }: { stats: Stat[] }) {
  const points = stats.filter((s) => s.average_mood != null);
  if (points.length < 2) return <p className="text-sm text-gray-500">Butuh minimal 2 minggu data.</p>;

  const W = 600, H = 200, P = 24;
  const x = (i: number) => P + (i * (W - 2 * P)) / (points.length - 1);
  const y = (v: number) => H - P - ((v - 1) * (H - 2 * P)) / 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Grafik tren rata-rata mood mingguan">
      { [1, 2, 3, 4, 5].map((v) => (
        <g key={v}>
          <line x1={P} x2={W - P} y1={y(v)} y2={y(v)} stroke="#E5E7EB" />
          <text x={4} y={y(v) + 4} fontSize="10" fill="#6B7280">{v}</text>
        </g>
      ))}
      <polyline
        fill="none"
        stroke={PRIMARY}
        strokeWidth="2"
        points={points.map((s, i) => `${x(i)},${y(Number(s.average_mood))}`).join(" ")}
      />
      {points.map((s, i) => (
        <circle key={s.period} cx={x(i)} cy={y(Number(s.average_mood))} r="3" fill={PRIMARY}>
          <title>{`${new Date(s.period).toLocaleDateString("id-ID")}: ${Number(s.average_mood).toFixed(2)}`}</title>
        </circle>
      ))}
    </svg>
  );
}
