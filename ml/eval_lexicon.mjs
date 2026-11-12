// Evaluasi fallback kamus kata pada data uji SmSA yang sama dengan model IndoBERT.
// Jalankan: node ml/eval_lexicon.mjs   (Node >= 22.18, mengimpor file .ts langsung)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { lexiconSentiment } from "../supabase/functions/_shared/sentiment.ts";

const here = new URL(".", import.meta.url);
const MAP = { Positif: "positive", Netral: "neutral", Negatif: "negative" };
const LABELS = Object.values(MAP);

const rows = readFileSync(new URL("data/test.tsv", here), "utf8")
  .split("\n")
  .map((l) => l.split("\t"))
  .filter((r) => r.length === 2 && LABELS.includes(r[1].trim()));

const pairs = rows.map(([text, gold]) => [gold.trim(), MAP[lexiconSentiment(text)]]);
const report = {};
for (const label of LABELS) {
  const tp = pairs.filter(([g, p]) => g === label && p === label).length;
  const predicted = pairs.filter(([, p]) => p === label).length;
  const support = pairs.filter(([g]) => g === label).length;
  const precision = predicted ? tp / predicted : 0;
  const recall = support ? tp / support : 0;
  report[label] = { precision, recall, "f1-score": precision + recall ? (2 * precision * recall) / (precision + recall) : 0, support };
}
report.accuracy = pairs.filter(([g, p]) => g === p).length / pairs.length;
report["macro avg"] = Object.fromEntries(
  ["precision", "recall", "f1-score"].map((k) => [k, LABELS.reduce((a, l) => a + report[l][k], 0) / LABELS.length]),
);

mkdirSync(new URL("results/", here), { recursive: true });
writeFileSync(new URL("results/lexicon_smsa.json", here), JSON.stringify({ dataset: "SmSA (IndoNLU)", test_size: pairs.length, test: report }, null, 2));
console.table(Object.fromEntries(Object.entries(report).filter(([, v]) => typeof v === "object").map(([k, v]) => [k, Object.fromEntries(Object.entries(v).map(([m, x]) => [m, +x.toFixed(4)]))])));
console.log("accuracy", report.accuracy.toFixed(4));
