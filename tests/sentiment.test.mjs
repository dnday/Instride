// @vitest-environment node
// Uji logika retry dan pemilihan jurnal untuk analisis ulang (Issue #51).
import { test } from "vitest";
import assert from "node:assert/strict";
import { analysisSource, selectPending, withRetry } from "../supabase/functions/_shared/sentiment.ts";

test("withRetry berhenti begitu berhasil", async () => {
  let calls = 0;
  const r = await withRetry(async () => (++calls === 2 ? "ok" : null), 3, 1);
  assert.equal(r, "ok");
  assert.equal(calls, 2);
});

test("withRetry menganggap error sebagai gagal dan mengembalikan null setelah semua percobaan", async () => {
  let calls = 0;
  const r = await withRetry(async () => { calls++; throw new Error("Space tidur"); }, 3, 1);
  assert.equal(r, null);
  assert.equal(calls, 3);
});

test("withRetry dengan 1 percobaan tidak menunggu jeda", async () => {
  const t0 = Date.now();
  assert.equal(await withRetry(async () => null, 1, 5000), null);
  assert.ok(Date.now() - t0 < 1000);
});

test("analysisSource membaca objek, array, dan kosong", () => {
  assert.equal(analysisSource(null), null);
  assert.equal(analysisSource([]), null);
  assert.equal(analysisSource({ source: "inset" }), "inset");
  assert.equal(analysisSource([{ source: "indobert" }]), "indobert");
});

const j = (id, sa) => ({ journal_id: id, content: "x", sentiment_analysis: sa });

test("selectPending: jurnal baru dan label leksikon dianalisis ulang, label IndoBERT dibiarkan", () => {
  const journals = [j(1, null), j(2, { source: "inset" }), j(3, { source: "indobert" }), j(4, [])];
  const { fresh, redo } = selectPending(journals, true);
  assert.deepEqual(fresh.map((x) => x.journal_id), [1, 4]);
  assert.deepEqual(redo.map((x) => x.journal_id), [2]);
});

test("selectPending: tanpa model tidak ada analisis ulang", () => {
  const { redo } = selectPending([j(1, { source: "inset" })], false);
  assert.equal(redo.length, 0);
});

test("selectPending: maksimal 20 per panggilan, jurnal baru didahulukan", () => {
  const journals = [
    ...Array.from({ length: 15 }, (_, i) => j(i, null)),
    ...Array.from({ length: 15 }, (_, i) => j(100 + i, { source: "inset" })),
  ];
  const { fresh, redo } = selectPending(journals, true);
  assert.equal(fresh.length, 15);
  assert.equal(redo.length, 5);
});
