import type { Sentiment } from "../../supabase/functions/_shared/sentiment";

export type { Sentiment };
export const SENTIMENTS: Sentiment[] = ["Positif", "Netral", "Negatif"];

export type MoodRow = { mood_value: number; recorded_at: string };
export type JournalRow = {
  journal_id: number;
  content: string;
  created_at: string;
  // Array (relasi 1-n) atau objek (relasi 1-1 setelah journal_id UNIQUE), tergantung deteksi PostgREST
  sentiment_analysis?: { sentiment: Sentiment }[] | { sentiment: Sentiment } | null;
};

export type Journal = { id: number; content: string; sentiment: Sentiment | null };
/** Satu hari catatan: rata-rata mood hari itu + semua jurnal hari itu. */
export type DayEntry = { date: string; mood: number | null; journals: Journal[] };

/** Tanggal lokal YYYY-MM-DD (bukan UTC, agar jurnal jam 01.00 WIB tidak masuk hari sebelumnya). */
export const dayKey = (d: Date | string) => new Date(d).toLocaleDateString("en-CA");

export function mergeEntries(moods: MoodRow[], journals: JournalRow[]): DayEntry[] {
  const days = new Map<string, { moods: number[]; journals: Journal[] }>();
  const day = (k: string) => days.get(k) ?? days.set(k, { moods: [], journals: [] }).get(k)!;
  for (const m of moods) day(dayKey(m.recorded_at)).moods.push(m.mood_value);
  for (const j of journals)
    day(dayKey(j.created_at)).journals.push({
      id: j.journal_id,
      content: j.content,
      sentiment: [j.sentiment_analysis].flat()[0]?.sentiment ?? null,
    });
  return Array.from(days.entries())
    .map(([date, d]) => ({
      date,
      mood: d.moods.length ? d.moods.reduce((a, b) => a + b, 0) / d.moods.length : null,
      journals: d.journals,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export type HistoryFilter = { from?: string; to?: string; sentiment?: Sentiment | "" };

export function filterEntries(entries: DayEntry[], f: HistoryFilter): DayEntry[] {
  return entries.filter(
    (e) =>
      (!f.from || e.date >= f.from) &&
      (!f.to || e.date <= f.to) &&
      (!f.sentiment || e.journals.some((j) => j.sentiment === f.sentiment)),
  );
}

/** Deret mood harian `days` hari terakhir (hari tanpa mood = null, garis grafik terputus). */
export function trendSeries(entries: DayEntry[], days: number, now = new Date()) {
  const byDate = new Map(entries.map((e) => [e.date, e.mood]));
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1 - i));
    const mood = byDate.get(dayKey(d));
    return {
      date: dayKey(d),
      label: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      mood: mood == null ? null : Math.round(mood * 10) / 10,
    };
  });
}

/** Ringkasan 7 hari terakhir untuk kartu Personal Dashboard. */
export function weeklySummary(entries: DayEntry[], now = new Date()) {
  const from = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
  const week = entries.filter((e) => e.date >= from && e.date <= dayKey(now));
  const moods = week.map((e) => e.mood).filter((m): m is number => m != null);
  const counts = new Map<Sentiment, number>();
  for (const j of week.flatMap((e) => e.journals))
    if (j.sentiment) counts.set(j.sentiment, (counts.get(j.sentiment) ?? 0) + 1);
  const dominant = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return {
    averageMood: moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null,
    dominantSentiment: dominant,
    daysLogged: week.length,
    counts: SENTIMENTS.map((s) => ({ sentiment: s, count: counts.get(s) ?? 0 })),
  };
}
