// Evaluasi fallback leksikon InSet pada jurnal uji yang sama dengan ml/eval_journal.py.
// Jalankan: node ml/eval_journal_lexicon.mjs [ml/eval/jurnal_uji.csv] [nama] [keterangan data]   (Node >= 22.18)
// Hasil metrik: ml/results/lexicon_<nama>.json (nama bawaan: jurnal). InSet dibaca dari cache ml/data/ (diunduh oleh ml/eval_lexicon.mjs).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { buildLexicon } from "../supabase/functions/_shared/sentiment.ts";
import { lexiconSentiment } from "../supabase/functions/_shared/sentiment.ts";

const here = new URL(".", import.meta.url);
const LABELS = ["Positif", "Netral", "Negatif"];

/** CSV minimal: kolom berkutip ganda, koma dan baris baru di dalam kutipan, "" sebagai kutip. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else field += c;
  }
  if (field || row.length) rows.push([...row, field]);
  return rows.filter((r) => r.some((x) => x.trim()));
}

const csvPath = process.argv[2] ?? new URL("eval/jurnal_uji.csv", here);
const name = process.argv[3] ?? "jurnal";
const datasetNote = process.argv[4] ?? "jurnal bergaya mahasiswa, sintetis (disusun dengan bantuan AI; 6 baris ditinjau tim), label tunggal";
const [head, ...body] = parseCsv(readFileSync(csvPath, "utf8").replace(/^﻿/, ""));
const col = (n) => head.map((h) => h.trim()).indexOf(n);
const [iText, iLabel] = [col("text"), col("label")];
if (iText < 0 || iLabel < 0) throw new Error("CSV harus punya kolom text dan label");
const rows = body.map((r) => [r[iText]?.trim(), r[iLabel]?.trim()]).filter(([t, l]) => t && l);
const bad = rows.filter(([, l]) => !LABELS.includes(l));
if (bad.length) throw new Error(`label tidak dikenal: ${[...new Set(bad.map(([, l]) => l))].join(", ")}`);
if (!rows.length) throw new Error("tidak ada baris berlabel");

const cached = (f) => {
  const p = new URL(`data/${f}`, here);
  if (!existsSync(p)) throw new Error(`${f} belum ada; jalankan dulu: node ml/eval_lexicon.mjs`);
  return readFileSync(p, "utf8");
};
const lex = buildLexicon(cached("inset-positive.tsv"), cached("inset-negative.tsv"));

const pairs = rows.map(([text, gold]) => [gold, lexiconSentiment(text, lex)]);
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
  ["precision", "recall", "f1-score"].map((k) => {
    const present = LABELS.filter((l) => report[l].support > 0); // macro hanya atas kelas yang punya data
    return [k, present.reduce((a, l) => a + report[l][k], 0) / present.length];
  }),
);

mkdirSync(new URL("results/", here), { recursive: true });
writeFileSync(
  new URL(`results/lexicon_${name}.json`, here),
  JSON.stringify({ lexicon: "InSet (Koto & Rahmaningtyas, IALP 2017)", dataset: datasetNote, n: rows.length, test: report }, null, 2),
);
console.table(
  Object.fromEntries(
    [...LABELS, "macro avg"].map((k) => [k, Object.fromEntries(Object.entries(report[k]).map(([m, x]) => [m, +x.toFixed(4)]))]),
  ),
);
console.log("n", rows.length, "| akurasi", report.accuracy.toFixed(4));
