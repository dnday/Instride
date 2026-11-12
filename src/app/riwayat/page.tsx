"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { analyzePending, ErrorNote, Loading, loadHistory, SentimentBadge, StudentPage, useStudent } from "@/components/StudentShell";
import { type DayEntry, filterEntries, type HistoryFilter, mergeEntries, SENTIMENTS } from "@/lib/history";

const fmtDay = (d: string) =>
  new Date(`${d}T00:00`).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export default function RiwayatPage() {
  const auth = useStudent();
  const [entries, setEntries] = useState<DayEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<HistoryFilter>({ from: "", to: "", sentiment: "" });
  const [filter, setFilter] = useState<HistoryFilter>({});

  useEffect(() => {
    if (auth.status !== "ready") return;
    (async () => {
      await analyzePending(auth.supabase);
      const r = await loadHistory(auth.supabase);
      if (r.error) setError("Riwayat gagal dimuat. Periksa koneksi lalu muat ulang halaman.");
      setEntries(mergeEntries(r.moods, r.journals));
    })();
  }, [auth]);

  const shown = useMemo(() => entries && filterEntries(entries, filter), [entries, filter]);
  const rangeInvalid = !!draft.from && !!draft.to && draft.from > draft.to;

  function apply(e: FormEvent) {
    e.preventDefault();
    if (!rangeInvalid) setFilter(draft);
  }
  function reset() {
    setDraft({ from: "", to: "", sentiment: "" });
    setFilter({});
  }

  return (
    <StudentPage title="Riwayat Jurnal" intro="Semua mood dan jurnal yang pernah kamu catat.">
      {auth.status === "error" && <ErrorNote message={auth.message} />}
      {error && <ErrorNote message={error} />}

      <form onSubmit={apply} className="card grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
        <div>
          <label htmlFor="from" className="label">Dari tanggal</label>
          <input id="from" type="date" className="field" value={draft.from} max={draft.to || undefined}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
        </div>
        <div>
          <label htmlFor="to" className="label">Sampai tanggal</label>
          <input id="to" type="date" className="field" value={draft.to} min={draft.from || undefined}
            aria-invalid={rangeInvalid || undefined} aria-describedby={rangeInvalid ? "range-error" : undefined}
            onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
        </div>
        <div>
          <label htmlFor="sentiment" className="label">Sentimen</label>
          <select id="sentiment" className="field" value={draft.sentiment}
            onChange={(e) => setDraft({ ...draft, sentiment: e.target.value as HistoryFilter["sentiment"] })}>
            <option value="">Semua</option>
            {SENTIMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn" disabled={rangeInvalid}>Terapkan</button>
          <button type="button" className="btn-ghost" onClick={reset}>Reset</button>
        </div>
        {rangeInvalid && (
          <p id="range-error" role="alert" className="sm:col-span-4 text-xs text-red-600">
            Tanggal awal harus sebelum tanggal akhir.
          </p>
        )}
      </form>

      {!shown ? (
        auth.status !== "error" && <Loading />
      ) : shown.length === 0 ? (
        <div className="card text-center">
          <h2 className="text-lg font-semibold text-ink">
            {entries?.length ? "Tidak ada catatan yang cocok dengan filter" : "Belum ada catatan"}
          </h2>
          {entries?.length ? (
            <button type="button" className="btn-ghost mt-5" onClick={reset}>Hapus filter</button>
          ) : (
            <Link href="/dashboard" className="btn mt-5">Tulis catatan hari ini</Link>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((e) => (
            <li key={e.date} className="card">
              <div className="flex flex-wrap items-center gap-3">
                <span aria-label={e.mood == null ? "Tanpa mood" : `Mood ${e.mood.toFixed(1)} dari 5`}
                  className="grid h-11 w-11 place-items-center rounded-full border-2 border-brand-700 font-semibold text-brand-900">
                  {e.mood == null ? "–" : Number.isInteger(e.mood) ? e.mood : e.mood.toFixed(1)}
                </span>
                <h2 className="font-semibold text-ink">{fmtDay(e.date)}</h2>
              </div>
              {e.journals.length > 0 && (
                <ul className="mt-3 space-y-3">
                  {e.journals.map((j) => (
                    <li key={j.id} className="rounded-xl bg-surface p-3">
                      <SentimentBadge sentiment={j.sentiment} />
                      <p className="mt-2 whitespace-pre-line break-words text-sm text-ink">{j.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </StudentPage>
  );
}
