"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { MoodFace } from "@/components/MoodFace";
import { ErrorNote, Loading, loadWithBackgroundAnalysis, SentimentBadge, StudentPage, useStudent } from "@/components/StudentShell";
import { type DayEntry, mergeEntries, monthGrid, streak, trendSeries, weeklySummary } from "@/lib/history";
import { MOOD_COLORS, MOOD_LABELS, moodColor } from "@/lib/mood";

// Recharts (~100 KB) dimuat setelah halaman tampil, supaya ringkasan & kalender tidak menunggu grafik
const MoodTrendChart = dynamic(() => import("@/components/MoodTrendChart"), {
  ssr: false,
  loading: () => <div className="h-full animate-pulse rounded-xl bg-surface motion-reduce:animate-none" aria-hidden="true" />,
});

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const fmtNum = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 1 });

export default function PersonalDashboard() {
  const auth = useStudent();
  const [entries, setEntries] = useState<DayEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<7 | 30>(7);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  useEffect(() => {
    if (auth.status !== "ready") return;
    return loadWithBackgroundAnalysis(auth.supabase, (r) => {
      setError(r.error ? "Data gagal dimuat. Periksa koneksi lalu muat ulang halaman." : null);
      setEntries(mergeEntries(r.moods, r.journals));
    });
  }, [auth]);

  const summary = useMemo(() => entries && weeklySummary(entries), [entries]);
  const series = useMemo(() => entries && trendSeries(entries, range), [entries, range]);
  const cells = useMemo(() => entries && monthGrid(entries, month), [entries, month]);
  const days = useMemo(() => (entries ? streak(entries) : 0), [entries]);

  const shiftMonth = (by: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + by, 1));
  const thisMonth = month.getFullYear() === new Date().getFullYear() && month.getMonth() === new Date().getMonth();

  return (
    <StudentPage title="Dashboard Saya" intro="Hanya kamu yang dapat melihat halaman ini.">
      {auth.status === "error" && <ErrorNote message={auth.message} />}
      {error && <ErrorNote message={error} />}
      {!entries || !summary || !series || !cells ? (
        auth.status !== "error" && <Loading />
      ) : entries.length === 0 ? (
        <div className="card text-center">
          <h2 className="font-serif text-xl font-semibold text-ink">Belum ada catatan</h2>
          <p className="mt-2 text-muted">Catat mood pertamamu; kalender dan tren akan terisi dari sana.</p>
          <Link href="/dashboard" className="btn mt-5">Tulis catatan hari ini</Link>
        </div>
      ) : (
        <>
          {/* Ringkasan dalam kalimat, bukan deretan kotak angka */}
          <section className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {summary.averageMood != null && <MoodFace value={summary.averageMood} className="h-16 w-16 shrink-0" />}
            <p className="max-w-[60ch] font-serif text-2xl leading-snug text-ink text-pretty">
              {summary.averageMood != null ? (
                <>
                  Tujuh hari terakhir mood-mu rata-rata <strong className="tnum">{fmtNum(summary.averageMood)}</strong>,{" "}
                  {MOOD_LABELS[Math.round(summary.averageMood)].toLowerCase()}
                </>
              ) : (
                <>Belum ada mood tercatat minggu ini</>
              )}
              {summary.dominantSentiment ? <>, dan jurnalmu kebanyakan bernada <strong>{summary.dominantSentiment.toLowerCase()}</strong>.</> : "."}{" "}
              {days > 1 ? (
                <>Kamu sudah mencatat <strong className="tnum">{days} hari</strong> berturut-turut.</>
              ) : (
                <>Kamu mencatat <strong className="tnum">{summary.daysLogged}</strong> dari 7 hari.</>
              )}
            </p>
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            {/* Kalender mood: momen gerak halaman ini (sel terisi bertahap) */}
            <section className="card lg:col-span-3" aria-labelledby="kalender">
              <div className="flex items-center justify-between gap-2">
                <h2 id="kalender" className="font-semibold text-ink">
                  {month.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                </h2>
                <div className="flex gap-1">
                  <button type="button" onClick={() => shiftMonth(-1)} aria-label="Bulan sebelumnya"
                    className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors duration-150 hover:bg-brand-50">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 6-6 6 6 6" /></svg>
                  </button>
                  <button type="button" onClick={() => shiftMonth(1)} disabled={thisMonth} aria-label="Bulan berikutnya"
                    className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors duration-150 hover:bg-brand-50 disabled:opacity-30">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 6 6 6-6 6" /></svg>
                  </button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-muted" aria-hidden="true">
                {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
              </div>
              <ol key={month.toISOString()} className="mt-1.5 grid grid-cols-7 gap-1.5">
                {cells.map((c, i) =>
                  c === null ? (
                    <li key={`kosong-${i}`} aria-hidden="true" />
                  ) : (
                    <li
                      key={c.date}
                      // Latar tint + cincin warna mood; angka tetap ink agar kontras terjaga di semua warna
                      style={{
                        ["--i" as string]: i,
                        ...(c.mood != null
                          ? { background: moodColor(c.mood).tint, boxShadow: `inset 0 0 0 2px ${moodColor(c.mood).fill}` }
                          : {}),
                      }}
                      className={`cell-in tnum grid aspect-square place-items-center rounded-xl text-sm font-semibold ${
                        c.mood != null ? "text-ink" : c.journals ? "bg-brand-50 text-brand-900" : "bg-surface text-muted"
                      }`}
                      aria-label={`${c.day}: ${c.mood != null ? `mood ${fmtNum(c.mood)}, ${MOOD_LABELS[Math.round(c.mood)]}` : "belum mencatat"}${c.journals ? `, ${c.journals} jurnal` : ""}`}
                    >
                      {c.day}
                    </li>
                  ),
                )}
              </ol>
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink" aria-label="Keterangan warna">
                {[1, 2, 3, 4, 5].map((v) => (
                  <li key={v} className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="h-3 w-3 rounded" style={{ background: MOOD_COLORS[v].fill }} />
                    {MOOD_LABELS[v]}
                  </li>
                ))}
              </ul>
            </section>

            <section className="card lg:col-span-2" aria-labelledby="sentimen">
              <h2 id="sentimen" className="font-semibold text-ink">Nada jurnal 7 hari</h2>
              <ul className="mt-4 space-y-3">
                {summary.counts.map((c) => {
                  const total = summary.counts.reduce((a, b) => a + b.count, 0) || 1;
                  return (
                    <li key={c.sentiment}>
                      <div className="flex items-center justify-between">
                        <SentimentBadge sentiment={c.sentiment} />
                        <span className="tnum text-sm font-semibold text-ink">{c.count} jurnal</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface" aria-hidden="true">
                        <div
                          className="bar-grow h-full rounded-full"
                          style={{
                            width: `${(c.count / total) * 100}%`,
                            background: c.sentiment === "Positif" ? "#2A7470" : c.sentiment === "Netral" ? "#9AA5A2" : "#B4533A",
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Link href="/riwayat" className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 underline decoration-brand-100 decoration-2 underline-offset-4 hover:decoration-brand-700">
                Baca semua jurnal
              </Link>
            </section>
          </div>

          <section className="card" aria-labelledby="tren">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="tren" className="font-semibold text-ink">Tren mood {range} hari terakhir</h2>
              <div role="group" aria-label="Rentang grafik" className="flex gap-1 rounded-full bg-surface p-1">
                {([7, 30] as const).map((r) => (
                  <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)}
                    className={`min-h-11 rounded-full px-4 text-sm font-medium transition-colors duration-150 ${range === r ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}>
                    {r} hari
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 h-64" role="img"
              aria-label={`Grafik mood: ${series.filter((s) => s.mood != null).map((s) => `${s.label} ${s.mood}`).join(", ") || "belum ada data"}`}>
              <MoodTrendChart series={series} range={range} />
            </div>
          </section>
        </>
      )}
    </StudentPage>
  );
}
