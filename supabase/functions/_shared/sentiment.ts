// Logika sentimen bersama: dipakai Edge Function (Deno) dan diuji Vitest. Tanpa dependency.

export type Sentiment = "Positif" | "Netral" | "Negatif";

// Model IndoBERT default. Label: LABEL_0 = positif, LABEL_1 = netral, LABEL_2 = negatif.
export const DEFAULT_MODEL = "mdhugol/indonesia-bert-sentiment-classification";

// ---------------------------------------------------------------------------------------------------
// Fallback leksikon: InSet (Indonesia Sentiment Lexicon), 3.609 kata positif & 6.609 kata negatif berbobot -5..+5.
//   Koto, F. & Rahmaningtyas, G. Y. (2017). InSet Lexicon: Evaluation of a Word List for Indonesian Sentiment
//   Analysis in Microblogs. IALP 2017, IEEE. doi:10.1109/IALP.2017.8300625. https://github.com/fajri91/InSet
// Repo InSet tidak mencantumkan lisensi, jadi daftar katanya tidak disalin ke repo ini; dimuat dari sumber aslinya.
// Skor = jumlah bobot kata (kata yang ada di kedua daftar dijumlahkan); > 0 Positif, < 0 Negatif, 0 Netral.
// ---------------------------------------------------------------------------------------------------
export const INSET_URLS = {
  positive: "https://raw.githubusercontent.com/fajri91/InSet/master/positive.tsv",
  negative: "https://raw.githubusercontent.com/fajri91/InSet/master/negative.tsv",
};

/** Kata ingkar bahasa Indonesia (Tata Bahasa Baku Bahasa Indonesia: tidak/tak, bukan, belum, jangan, tiada)
 *  ditambah ragam cakapan "tidak" yang tercatat di KBBI (enggak, nggak, gak, ga). */
export const NEGATORS = new Set(["tidak", "tak", "bukan", "belum", "jangan", "tiada", "enggak", "nggak", "gak", "ga"]);

/** Jendela negasi: polaritas kata sentimen dalam 3 token setelah kata ingkar dibalik
 *  (Fixed Window Length n = 3, hasil terbaik pada studi negasi sentimen bahasa Indonesia, UGM 2016). */
export const NEGATION_WINDOW = 3;

export type Lexicon = { weights: Map<string, number>; maxWords: number };

const tokenize = (text: string) => text.toLowerCase().replace(/[^a-z\s-]/g, " ").split(/[\s-]+/).filter(Boolean);

/** Bangun leksikon dari isi TSV InSet ("word<TAB>weight" dengan baris judul). */
export function buildLexicon(...tsvs: string[]): Lexicon {
  const weights = new Map<string, number>();
  let maxWords = 1;
  for (const tsv of tsvs)
    for (const line of tsv.split(/\r?\n/).slice(1)) {
      const [word, w] = line.split("\t");
      const weight = Number(w);
      const key = tokenize(word ?? "").join(" ");
      if (!key || !Number.isFinite(weight) || NEGATORS.has(key)) continue; // kata ingkar diperlakukan sebagai negasi
      weights.set(key, (weights.get(key) ?? 0) + weight);
      maxWords = Math.max(maxWords, key.split(" ").length);
    }
  return { weights, maxWords };
}

/** Skor leksikon: frasa terpanjang dicocokkan dulu; bobot dibalik bila berada dalam jendela negasi. */
export function lexiconScore(text: string, lex: Lexicon): number {
  const tokens = tokenize(text);
  let score = 0;
  let negateUntil = -1;
  for (let i = 0; i < tokens.length; ) {
    if (NEGATORS.has(tokens[i])) {
      negateUntil = i + NEGATION_WINDOW;
      i++;
      continue;
    }
    let matched = 1;
    for (let n = Math.min(lex.maxWords, tokens.length - i); n >= 1; n--) {
      const w = lex.weights.get(tokens.slice(i, i + n).join(" "));
      if (w !== undefined) {
        score += i <= negateUntil ? -w : w;
        matched = n;
        break;
      }
    }
    i += matched;
  }
  return score;
}

export function lexiconSentiment(text: string, lex: Lexicon): Sentiment {
  const s = lexiconScore(text, lex);
  return s > 0 ? "Positif" : s < 0 ? "Negatif" : "Netral";
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
