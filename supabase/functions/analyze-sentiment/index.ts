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
  type Sentiment,
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

/** null = model maupun leksikon tidak tersedia; jurnal dibiarkan tanpa label dan dicoba lagi nanti. */
async function classify(text: string): Promise<{ sentiment: Sentiment; source: "indobert" | "inset" } | null> {
  if (remote) {
    try {
      // Timeout 25 detik: Space gratis bisa "bangun tidur" dulu saat lama tidak dipakai
      const label = pickTopLabel(await remote(text, AbortSignal.timeout(25000)));
      const sentiment = label ? labelToSentiment(label) : null;
      if (sentiment) return { sentiment, source: "indobert" };
    } catch {
      // jatuh ke leksikon InSet
    }
  }
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
    .select("journal_id, content, sentiment_analysis(sentiment_id)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return json({ error: error.message }, 500);

  // ponytail: maks 20 jurnal per panggilan, sisanya terproses di kunjungan berikutnya
  const pending = (journals ?? []).filter((j) => ![j.sentiment_analysis].flat().filter(Boolean).length).slice(0, 20);
  const classified = await Promise.all(pending.map(async (j) => ({ journal_id: j.journal_id, result: await classify(j.content) })));
  const results = classified.flatMap(({ journal_id, result }) => (result ? [{ journal_id, ...result }] : []));

  if (results.length) {
    // Tabel sentiment_analysis sengaja tanpa policy tulis untuk user; hanya service role yang menulis
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error: insErr } = await admin
      .from("sentiment_analysis")
      .upsert(results.map(({ journal_id, sentiment }) => ({ journal_id, sentiment })), {
        onConflict: "journal_id",
        ignoreDuplicates: true,
      });
    if (insErr) return json({ error: insErr.message }, 500);
  }

  return json({ analyzed: results.length, pending: pending.length - results.length, sources: results.map((r) => r.source) });
});
