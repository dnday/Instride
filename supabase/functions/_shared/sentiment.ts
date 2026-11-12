// Logika sentimen bersama: dipakai Edge Function (Deno) dan diuji Vitest. Tanpa dependency.

export type Sentiment = "Positif" | "Netral" | "Negatif";

// Model IndoBERT default. Label: LABEL_0 = positif, LABEL_1 = netral, LABEL_2 = negatif.
export const DEFAULT_MODEL = "mdhugol/indonesia-bert-sentiment-classification";

const POSITIVE = new Set(
  "senang bahagia gembira tenang lega bersyukur syukur semangat puas bangga nyaman suka cinta sayang baik bagus hebat seru asik asyik mantap berhasil sukses lancar optimis damai ceria santai produktif termotivasi menyenangkan membantu terbantu sehat segar enak indah tertawa ketawa".split(" "),
);
const NEGATIVE = new Set(
  "sedih kecewa marah kesal stres stress cemas khawatir takut gelisah lelah capek capai letih bosan kesepian sepi galau frustasi frustrasi putus asa depresi tertekan pusing sakit gagal buruk jelek susah sulit berat panik menangis nangis benci malu bingung terbebani overthinking burnout sendirian hampa".split(" "),
);
const NEGATORS = new Set(["tidak", "tak", "bukan", "belum", "kurang", "nggak", "ngga", "gak", "ga", "enggak", "tdk"]);

/** Fallback kamus kata: hitung kata positif/negatif, kata setelah negasi dibalik ("tidak senang" = negatif). */
export function lexiconSentiment(text: string): Sentiment {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  let score = 0;
  words.forEach((w, i) => {
    const s = POSITIVE.has(w) ? 1 : NEGATIVE.has(w) ? -1 : 0;
    if (s) score += NEGATORS.has(words[i - 1] ?? "") ? -s : s;
  });
  return score > 0 ? "Positif" : score < 0 ? "Negatif" : "Netral";
}

/** Ubah label keluaran model Hugging Face ke kategori Instride; null jika tidak dikenali. */
export function labelToSentiment(label: string): Sentiment | null {
  const l = label.toLowerCase();
  if (l === "label_0" || l.startsWith("pos")) return "Positif";
  if (l === "label_1" || l.startsWith("neu") || l.startsWith("net")) return "Netral";
  if (l === "label_2" || l.startsWith("neg")) return "Negatif";
  return null;
}

/** Ambil label skor tertinggi dari respons HF Inference ([[{label,score}]] atau [{label,score}]). */
export function pickTopLabel(response: unknown): string | null {
  const list = Array.isArray(response) && Array.isArray(response[0]) ? response[0] : response;
  if (!Array.isArray(list) || list.length === 0) return null;
  const top = list.reduce((a, b) => (b?.score > a?.score ? b : a));
  return typeof top?.label === "string" ? top.label : null;
}

/** Ambil isi `data` dari event "complete" pada respons SSE API Gradio; null bila error/tidak ada. */
export function parseGradioSse(body: string): unknown | null {
  const lines = body.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== "event: complete") continue;
    const data = lines.slice(i + 1).find((l) => l.startsWith("data:"));
    if (!data) return null;
    try {
      return JSON.parse(data.slice(5).trim());
    } catch {
      return null;
    }
  }
  return null;
}
