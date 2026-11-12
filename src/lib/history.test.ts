import { filterEntries, mergeEntries, trendSeries, weeklySummary } from "./history";
import {
  buildLexicon,
  labelToSentiment,
  lexiconScore,
  lexiconSentiment,
  NEGATION_WINDOW,
  pickTopLabel,
} from "../../supabase/functions/_shared/sentiment";

const at = (y: number, m: number, d: number, h = 9) => new Date(y, m - 1, d, h).toISOString();

const entries = mergeEntries(
  [
    { mood_value: 4, recorded_at: at(2026, 11, 10) },
    { mood_value: 2, recorded_at: at(2026, 11, 10, 20) },
    { mood_value: 5, recorded_at: at(2026, 11, 12) },
    { mood_value: 1, recorded_at: at(2026, 10, 1) },
  ],
  [
    { journal_id: 1, content: "a", created_at: at(2026, 11, 10), sentiment_analysis: [{ sentiment: "Negatif" }] },
    { journal_id: 2, content: "b", created_at: at(2026, 11, 12), sentiment_analysis: { sentiment: "Positif" } },
    { journal_id: 3, content: "c", created_at: at(2026, 11, 11), sentiment_analysis: [] },
  ],
);

describe("history", () => {
  it("menggabungkan per hari lokal, terbaru dulu, rata-rata mood", () => {
    expect(entries.map((e) => e.date)).toEqual(["2026-11-12", "2026-11-11", "2026-11-10", "2026-10-01"]);
    expect(entries[2].mood).toBe(3);
    expect(entries[1]).toMatchObject({ mood: null, journals: [{ id: 3, sentiment: null }] });
  });

  it("filter tanggal & sentimen", () => {
    expect(filterEntries(entries, { from: "2026-11-11" }).length).toBe(2);
    expect(filterEntries(entries, { to: "2026-11-10" }).map((e) => e.date)).toEqual(["2026-11-10", "2026-10-01"]);
    expect(filterEntries(entries, { sentiment: "Negatif" }).map((e) => e.date)).toEqual(["2026-11-10"]);
  });

  it("tren & ringkasan 7 hari", () => {
    const now = new Date(2026, 10, 12, 15);
    const s = trendSeries(entries, 7, now);
    expect(s).toHaveLength(7);
    expect(s[6]).toMatchObject({ date: "2026-11-12", mood: 5 });
    expect(s[0].mood).toBeNull();
    const w = weeklySummary(entries, now);
    expect(w.averageMood).toBe(4);
    expect(w.daysLogged).toBe(3);
    expect(w.dominantSentiment).not.toBeNull();
  });
});

describe("sentimen", () => {
  // Potongan kecil berformat InSet (word<TAB>weight); isi InSet asli dimuat dari repo sumbernya saat runtime
  const tsv = (rows: [string, number][]) => ["word\tweight", ...rows.map(([w, n]) => `${w}\t${n}`)].join("\n");
  const lex = buildLexicon(
    tsv([["senang", 4], ["lega", 3], ["putus asa", -5], ["tidak", -5], ["kaget", 2]]),
    tsv([["capek", -3], ["stres", -4], ["kaget", -3], ["batas (waktu)", -2]]),
  );

  it("leksikon InSet: jumlah bobot menentukan kelas", () => {
    expect(lexiconScore("Hari ini aku senang dan lega", lex)).toBe(7);
    expect(lexiconSentiment("Hari ini aku senang dan lega", lex)).toBe("Positif");
    expect(lexiconSentiment("capek banget, stres sama tugas", lex)).toBe("Negatif");
    expect(lexiconSentiment("kuliah jam tujuh", lex)).toBe("Netral");
  });

  it("frasa multi-kata, kata di dua daftar, dan kata ingkar", () => {
    expect(lexiconScore("rasanya putus asa", lex)).toBe(-5); // frasa dicocokkan utuh
    expect(lexiconScore("aku kaget", lex)).toBe(-1); // +2 dan -3 dijumlahkan
    expect(lexiconScore("mendekati batas waktu", lex)).toBe(-2); // keterangan dalam kurung jadi bagian frasa
    expect(lex.weights.has("tidak")).toBe(false); // kata ingkar tidak dihitung sebagai sentimen
  });

  it("negasi membalik polaritas dalam jendela 3 token", () => {
    expect(NEGATION_WINDOW).toBe(3);
    expect(lexiconSentiment("aku tidak senang hari ini", lex)).toBe("Negatif");
    expect(lexiconScore("tidak terlalu begitu senang", lex)).toBe(-4); // token ke-3 setelah negasi
    expect(lexiconScore("tidak ada yang bikin aku senang", lex)).toBe(4); // di luar jendela
    expect(lexiconScore("nggak capek kok", lex)).toBe(3);
  });

  it("label model HF", () => {
    expect(labelToSentiment("LABEL_0")).toBe("Positif");
    expect(labelToSentiment("LABEL_2")).toBe("Negatif");
    expect(labelToSentiment("neutral")).toBe("Netral");
    expect(labelToSentiment("x")).toBeNull();
    expect(pickTopLabel([[{ label: "LABEL_1", score: 0.2 }, { label: "LABEL_2", score: 0.7 }]])).toBe("LABEL_2");
    expect(pickTopLabel({ error: "loading" })).toBeNull();
  });
});

describe("respons API Gradio (Space)", () => {
  it("membaca event complete dan menolak event error", async () => {
    const { parseGradioSse } = await import("../../supabase/functions/_shared/sentiment");
    const ok = 'event: complete\ndata: [[{"label": "positive", "score": 0.0007}, {"label": "negative", "score": 0.9988}]]\n\n';
    expect(pickTopLabel(parseGradioSse(ok))).toBe("negative");
    expect(parseGradioSse("event: error\ndata: null\n\n")).toBeNull();
    expect(parseGradioSse("event: heartbeat\ndata: null\n\n")).toBeNull();
  });
});
