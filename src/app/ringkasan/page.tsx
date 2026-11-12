"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { analyzePending, ErrorNote, Loading, loadHistory, SentimentBadge, StudentPage, useStudent } from "@/components/StudentShell";
import { type DayEntry, mergeEntries, trendSeries, weeklySummary } from "@/lib/history";

const fmtDay = (d: string) => new Date(`${d}T00:00`).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });

export default function PersonalDashboard() {
  const auth = useStudent();
  const [entries, setEntries] = useState<DayEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<7 | 30>(7);

  useEffect(() => {
    if (auth.status !== "ready") return;
    (async () => {
      await analyzePending(auth.supabase);
      const r = await loadHistory(auth.supabase);
      if (r.error) setError("Data gagal dimuat. Periksa koneksi lalu muat ulang halaman.");
      setEntries(mergeEntries(r.moods, r.journals));
    })();
  }, [auth]);

  const summary = useMemo(() => entries && weeklySummary(entries), [entries]);
  const series = useMemo(() => entries && trendSeries(entries, range), [entries, range]);

  return (
    <StudentPage title="Dashboard Saya" intro="Ringkasan mood dan jurnalmu. Hanya kamu yang dapat melihat halaman ini.">
      {auth.status === "error" && <ErrorNote message={auth.message} />}
      {error && <ErrorNote message={error} />}
      {!entries || !summary || !series ? (
        auth.status !== "error" && <Loading />
      ) : entries.length === 0 ? (
        <div className="card text-center">
          <h2 className="text-lg font-semibold text-ink">Belum ada catatan</h2>
          <p className="mt-2 text-muted">Catat mood dan jurnal pertamamu; grafik tren muncul setelah itu.</p>
          <Link href="/dashboard" className="btn mt-5">Tulis catatan hari ini</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Kpi label="Mood rata-rata 7 hari" value={summary.averageMood == null ? "—" : summary.averageMood.toFixed(1)} unit="/ 5" />
            <Kpi label="Sentimen dominan" value={summary.dominantSentiment ?? "—"} />
            <Kpi label="Hari tercatat" value={String(summary.daysLogged)} unit="dari 7 hari" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <section className="card lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-ink">Tren mood {range} hari terakhir</h2>
                <div role="group" aria-label="Rentang grafik" className="flex gap-1">
                  {([7, 30] as const).map((r) => (
                    <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)}
                      className={`min-h-11 rounded-full px-4 text-sm font-medium ${range === r ? "bg-brand-50 text-brand-900" : "text-muted hover:text-ink"}`}>
                      {r} hari
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 h-64" role="img"
                aria-label={`Grafik mood: ${series.filter((s) => s.mood != null).map((s) => `${s.label} ${s.mood}`).join(", ") || "belum ada data"}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                    <CartesianGrid stroke="#E6F2F1" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#56625F" }} tickLine={false} axisLine={false}
                      interval={range === 7 ? 0 : "preserveStartEnd"} />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 12, fill: "#56625F" }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v) => [`${v} / 5`, "Mood"]} contentStyle={{ borderRadius: 12, borderColor: "#CFE9E6" }} />
                    <Line type="monotone" dataKey="mood" stroke="#2A7470" strokeWidth={2.5} dot={{ r: 3, fill: "#2A7470" }}
                      activeDot={{ r: 5 }} connectNulls isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="card">
              <h2 className="font-semibold text-ink">Sentimen jurnal 7 hari</h2>
              <ul className="mt-4 space-y-3">
                {summary.counts.map((c) => (
                  <li key={c.sentiment} className="flex items-center justify-between">
                    <SentimentBadge sentiment={c.sentiment} />
                    <span className="text-sm font-semibold text-ink">{c.count} jurnal</span>
                  </li>
                ))}
              </ul>
              <h2 className="mt-6 font-semibold text-ink">Catatan terbaru</h2>
              <ul className="mt-2 divide-y divide-brand-100">
                {entries.slice(0, 4).map((e) => (
                  <li key={e.date} className="py-2 text-sm">
                    <span className="font-medium text-ink">{fmtDay(e.date)}</span>
                    <span className="block text-muted">
                      {e.mood != null ? `Mood ${e.mood.toFixed(1)}` : "Tanpa mood"} · {e.journals.length} jurnal
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/riwayat" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 hover:underline">
                Lihat semua riwayat
              </Link>
            </section>
          </div>
        </>
      )}
    </StudentPage>
  );
}

function Kpi({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="card">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">
        {value} {unit && <span className="text-base font-medium text-muted">{unit}</span>}
      </p>
    </div>
  );
}
