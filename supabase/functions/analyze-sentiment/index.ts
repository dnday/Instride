// Edge Function: menganalisis sentimen jurnal milik user yang belum punya hasil.
// App di-export statis (GitHub Pages) sehingga tidak bisa memakai API Route Next.js;
// token Hugging Face tetap rahasia di sini (secret HF_TOKEN), bukan di browser.
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  buildLexicon,
  DEFAULT_MODEL,
  INSET_URLS,
  type Lexicon,
  labelToSentiment,
  lexiconSentiment,
  parseGradioSse,
  pickTopLabel,
  selectPending,
  type Sentiment,
  type Source,
  withRetry,
} from "../_shared/sentiment.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// Prioritas: API model sendiri (Hugging Face Space menjalankan mnrsu/instride), lalu HF Inference, lalu leksikon InSet.
// HF Inference gratis tidak melayani model unggahan sendiri, jadi model hasil fine-tuning butuh SENTIMENT_URL.
const SENTIMENT_URL = Deno.env.get("SENTIMENT_URL");
const SENTIMENT_KEY = Deno.env.get("SENTIMENT_KEY");
const HF_TOKEN = Deno.env.get("HF_TOKEN");
const MODEL = Deno.env.get("HF_MODEL") ?? DEFAULT_MODEL;

/** Space Gradio (ZeroGPU): POST minta event_id, lalu GET hasilnya sebagai SSE. */
async function viaSpace(text: string, signal: AbortSignal): Promise<unknown | null> {
  const base = SENTIMENT_URL!.replace(/\/+$/, "");
  const start = await fetch(`${base}/gradio_api/call/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [text, SENTIMENT_KEY] }),
    signal,
  });
  if (!start.ok) return null;
  const { event_id } = await start.json();
  if (!event_id) return null;
  const res = await fetch(`${base}/gradio_api/call/predict/${event_id}`, { signal });
  return res.ok ? parseGradioSse(await res.text()) : null;
}

async function viaHfInference(text: string, signal: AbortSignal): Promise<unknown | null> {
  const res = await fetch(`https://router.huggingface.co/hf-inference/models/${MODEL}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: text }),
    signal,
  });
  return res.ok ? res.json() : null;
}

const remote = SENTIMENT_URL && SENTIMENT_KEY ? viaSpace : HF_TOKEN ? viaHfInference : null;

// InSet dimuat dari repo aslinya sekali per instance (tidak disalin ke repo ini karena tanpa lisensi)
let inset: Promise<Lexicon | null> | null = null;
function loadInset(): Promise<Lexicon | null> {
  inset ??= Promise.all(
    [INSET_URLS.positive, INSET_URLS.negative].map((u) =>
      fetch(u, { signal: AbortSignal.timeout(10000) }).then((r) => (r.ok ? r.text() : Promise.reject(r.status))),
    ),
  )
    .then((tsvs) => buildLexicon(...tsvs))
    .catch(() => {
      inset = null; // coba muat ulang pada panggilan berikutnya
      return null;
    });
  return inset;
}

// Space gratis bisa "bangun tidur" dulu: beri beberapa kesempatan sebelum jatuh ke leksikon (Issue #51).
const ATTEMPT_TIMEOUT_MS = 20000;
const RETRY_DELAY_MS = 2000;

/** Coba model sendiri. `attempts` > 1 memberi waktu Space bangun; null = model tidak menjawab. */
async function viaModel(text: string, attempts: number): Promise<Sentiment | null> {
  if (!remote) return null;
  return withRetry(
    async () => {
      const label = pickTopLabel(await remote(text, AbortSignal.timeout(ATTEMPT_TIMEOUT_MS)));
      return label ? labelToSentiment(label) : null;
    },
    attempts,
    RETRY_DELAY_MS,
  );
}

/** Jurnal baru: IndoBERT (dengan retry), bila tetap gagal leksikon InSet yang ditandai sementara ('inset').
 *  null = model maupun leksikon tidak tersedia; jurnal dibiarkan tanpa label dan dicoba lagi nanti. */
async function classify(text: string): Promise<{ sentiment: Sentiment; source: Source } | null> {
  const sentiment = await viaModel(text, 3);
  if (sentiment) return { sentiment, source: "indobert" };
  const lex = await loadInset();
  return lex ? { sentiment: lexiconSentiment(text, lex), source: "inset" } : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url = Deno.env.get("SUPABASE_URL")!;
  const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: auth } = await asUser.auth.getUser();
  if (!auth.user) return json({ error: "unauthorized" }, 401);

  // RLS membatasi ke jurnal milik user sendiri
  const { data: journals, error } = await asUser
    .from("journals")
    .select("journal_id, content, sentiment_analysis(sentiment_id, source)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return json({ error: error.message }, 500);

  // ponytail: maks 20 jurnal per panggilan, sisanya terproses di kunjungan berikutnya
  const { fresh, redo } = selectPending(journals ?? [], remote !== null);
  const classified = await Promise.all(fresh.map(async (j) => ({ journal_id: j.journal_id, result: await classify(j.content) })));
  // Analisis ulang label sementara: sesudah jurnal baru, supaya Space sudah bangun; hanya hasil IndoBERT yang menimpa
  const reclassified = await Promise.all(
    redo.map(async (j) => {
      const sentiment = await viaModel(j.content, 1);
      return { journal_id: j.journal_id, result: sentiment ? { sentiment, source: "indobert" as Source } : null };
    }),
  );
  const toRows = (items: typeof classified) =>
    items.flatMap(({ journal_id, result }) => (result ? [{ journal_id, sentiment: result.sentiment, source: result.source }] : []));
  const freshRows = toRows(classified);
  const redoRows = toRows(reclassified);

  if (freshRows.length || redoRows.length) {
    // Tabel sentiment_analysis sengaja tanpa policy tulis untuk user; hanya service role yang menulis
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    // Jurnal baru tidak menimpa baris yang sudah ada (mis. panggilan paralel dari tab lain)
    if (freshRows.length) {
      const { error: e } = await admin.from("sentiment_analysis").upsert(freshRows, { onConflict: "journal_id", ignoreDuplicates: true });
      if (e) return json({ error: e.message }, 500);
    }
    // Analisis ulang: label 'inset' ditimpa hasil IndoBERT; analyzed_at tidak diubah
    if (redoRows.length) {
      const { error: e } = await admin.from("sentiment_analysis").upsert(redoRows, { onConflict: "journal_id" });
      if (e) return json({ error: e.message }, 500);
    }
  }

  const analyzed = freshRows.length + redoRows.length;
  return json({ analyzed, pending: fresh.length + redo.length - analyzed, sources: [...freshRows, ...redoRows].map((r) => r.source) });
});
