"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { analyzePending, ErrorNote, Loading, loadHistory, SentimentBadge, StudentPage, useStudent } from "@/components/StudentShell";
import { MoodFace } from "@/components/MoodFace";
import { type DayEntry, filterEntries, type HistoryFilter, mergeEntries, SENTIMENTS } from "@/lib/history";
import { MOOD_LABELS } from "@/lib/mood";

const fmtDay = (d: string) =>
  new Date(`${d}T00:00`).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export default function RiwayatPage() {
  const auth = useStudent();
  const [entries, setEntries] = useState<DayEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<HistoryFilter>({ from: "", to: "", sentiment: "" });
  const [filter, setFilter] = useState<HistoryFilter>({});
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /** Hapus satu jurnal (hasil sentimennya ikut terhapus lewat ON DELETE CASCADE). RLS: hanya milik sendiri. */
  async function removeJournal(id: number) {
    if (auth.status !== "ready") return;
    setDeleting(true);
    setDeleteError(null);
    const { error: err } = await auth.supabase.from("journals").delete().eq("journal_id", id);
    setDeleting(false);
    if (err) return setDeleteError("Jurnal gagal dihapus. Periksa koneksi lalu coba lagi.");
    setConfirmId(null);
    setEntries((list) =>
      (list ?? []).map((e) => ({ ...e, journals: e.journals.filter((j) => j.id !== id) })).filter((e) => e.mood != null || e.journals.length),
    );
  }

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
          {deleteError && <ErrorNote message={deleteError} />}
          {shown.map((e) => (
            <li key={e.date} className="card">
              <div className="flex flex-wrap items-center gap-3">
                {e.mood == null ? (
                  <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-dashed border-brand-100 text-muted" aria-label="Tanpa mood">–</span>
                ) : (
                  <span role="img" aria-label={`Mood ${e.mood.toFixed(1)} dari 5`}>
                    <MoodFace value={e.mood} className="h-11 w-11" />
                  </span>
                )}
                <div>
                  <h2 className="font-semibold text-ink">{fmtDay(e.date)}</h2>
                  {e.mood != null && (
                    <p className="text-sm text-muted">
                      Mood {Number.isInteger(e.mood) ? e.mood : e.mood.toFixed(1)} · {MOOD_LABELS[Math.round(e.mood)]}
                    </p>
                  )}
                </div>
              </div>
              {e.journals.length > 0 && (
                <ul className="mt-3 space-y-3">
                  {e.journals.map((j) => (
                    <li key={j.id} className="rounded-xl bg-surface p-4">
                      <div className="flex items-center justify-between gap-2">
                        <SentimentBadge sentiment={j.sentiment} />
                        {confirmId !== j.id && (
                          <button type="button" onClick={() => setConfirmId(j.id)}
                            className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-muted hover:text-negative"
                            aria-label="Hapus jurnal ini">
                            Hapus
                          </button>
                        )}
                      </div>
                      <p className="mt-2 whitespace-pre-line break-words text-ink leading-relaxed">{j.content}</p>
                      {confirmId === j.id && (
                        <div role="alert" className="pop-in mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm">
                          <span className="mr-auto font-medium text-ink">Hapus jurnal ini secara permanen?</span>
                          <button type="button" className="btn bg-negative hover:bg-negative" disabled={deleting} onClick={() => removeJournal(j.id)}>
                            {deleting ? "Menghapus..." : "Ya, hapus"}
                          </button>
                          <button type="button" className="btn-ghost" disabled={deleting} onClick={() => setConfirmId(null)}>Batal</button>
                        </div>
                      )}
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
