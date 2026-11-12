// @vitest-environment node
// Uji insert mood/jurnal, append-only, dan deteksi rentang "hari ini" (spec: mood-journal-input).
// Jalankan: npm run test:run
import { test, beforeAll } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const dir = new URL("../supabase/migrations/", import.meta.url);
const db = new PGlite();
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const ALICE = id(1);

async function setupStub() {
  await db.exec(`
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}');
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
      AS $$ SELECT nullif(current_setting('test.uid', true), '')::uuid $$;
    CREATE ROLE anon; CREATE ROLE authenticated;
    GRANT USAGE ON SCHEMA public, auth TO anon, authenticated;
    GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
  `);
}

async function as(role, uid, sql) {
  await db.exec(`SET ROLE ${role}; SELECT set_config('test.uid', '${uid ?? ""}', false);`);
  try {
    return (await db.query(sql)).rows;
  } finally {
    await db.exec("RESET ROLE;");
  }
}

beforeAll(async () => {
  await setupStub();
  for (const f of fs.readdirSync(dir).sort()) await db.exec(fs.readFileSync(new URL(f, dir), "utf8"));
  await db.exec(`
    GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
    GRANT UPDATE, DELETE ON public.moods, public.journals TO authenticated;
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
  `);
  await db.exec(`INSERT INTO auth.users VALUES ('${ALICE}', 'alice@ugm.ac.id', '{"name":"Alice"}')`);
}, 60_000);

test("insert mood: satu baris, user_id = auth.uid(), recorded_at default", async () => {
  await as("authenticated", ALICE, `INSERT INTO moods (user_id, mood_value) VALUES ('${ALICE}', 4)`);
  const rows = await as("authenticated", ALICE, "SELECT user_id, mood_value, recorded_at FROM moods");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].user_id, ALICE);
  assert.equal(Number(rows[0].mood_value), 4);
  assert.ok(rows[0].recorded_at, "recorded_at terisi default");
});

test("insert jurnal: satu baris, content sesuai, created_at default", async () => {
  await as("authenticated", ALICE, `INSERT INTO journals (user_id, content) VALUES ('${ALICE}', 'isi jurnal')`);
  const rows = await as("authenticated", ALICE, "SELECT content, created_at FROM journals");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].content, "isi jurnal");
  assert.ok(rows[0].created_at, "created_at terisi default");
});

test("append-only: submit mood lagi menambah baris baru", async () => {
  await as("authenticated", ALICE, `INSERT INTO moods (user_id, mood_value) VALUES ('${ALICE}', 2)`);
  const rows = await as("authenticated", ALICE, "SELECT mood_id FROM moods");
  assert.equal(rows.length, 2, "dua entri mood, tidak menimpa");
});

test("deteksi Today: query rentang hari ini hanya melihat baris hari ini", async () => {
  // seed satu mood kemarin
  await db.exec(`INSERT INTO moods (user_id, mood_value, recorded_at) VALUES ('${ALICE}', 1, now() - interval '1 day')`);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const rows = await as(
    "authenticated",
    ALICE,
    `SELECT mood_id FROM moods WHERE recorded_at >= '${start.toISOString()}' AND recorded_at < '${end.toISOString()}'`
  );
  // dua mood hari ini (value 4 dan 2), bukan yang kemarin
  assert.equal(rows.length, 2, "hanya entri hari ini yang terdeteksi");
});

// --- save_daily_entry: mood + jurnal dalam satu transaksi (jurnal opsional) ---

const count = async (table) =>
  Number((await db.query(`SELECT count(*) AS n FROM ${table} WHERE user_id = '${ALICE}'`)).rows[0].n);

test("save_daily_entry: mood + jurnal tersimpan bersama", async () => {
  const [m0, j0] = [await count("moods"), await count("journals")];
  const [row] = await as("authenticated", ALICE, `SELECT save_daily_entry(4, 'Hari ini cukup baik') AS r`);
  assert.ok(row.r.mood_id, "mood_id dikembalikan");
  assert.ok(row.r.journal_id, "journal_id dikembalikan");
  assert.equal(await count("moods"), m0 + 1);
  assert.equal(await count("journals"), j0 + 1);
});

test("save_daily_entry: jurnal kosong/spasi/null berarti hanya mood", async () => {
  const j0 = await count("journals");
  for (const sql of [`save_daily_entry(3, '   ')`, `save_daily_entry(3, '')`, `save_daily_entry(3)`]) {
    const [row] = await as("authenticated", ALICE, `SELECT ${sql} AS r`);
    assert.equal(row.r.journal_id, null);
  }
  assert.equal(await count("journals"), j0);
});

test("save_daily_entry: input tidak valid ditolak tanpa menyisakan data", async () => {
  const m0 = await count("moods");
  await assert.rejects(as("authenticated", ALICE, `SELECT save_daily_entry(0, 'x')`), /Mood harus/);
  await assert.rejects(as("authenticated", ALICE, `SELECT save_daily_entry(NULL, 'x')`), /Mood harus/);
  await assert.rejects(as("authenticated", ALICE, `SELECT save_daily_entry(3, repeat('a', 5001))`), /journals_content_check/);
  assert.equal(await count("moods"), m0, "mood tidak tersimpan bila jurnal ditolak (atomik)");
});

test("save_daily_entry: tanpa sesi ditolak dan anon tidak punya akses", async () => {
  await assert.rejects(as("authenticated", null, `SELECT save_daily_entry(3)`), /Sesi tidak valid/);
  await assert.rejects(as("anon", null, `SELECT save_daily_entry(3)`), /permission denied/);
});

test("nama profil: kosong atau lebih dari 100 karakter ditolak", async () => {
  await assert.rejects(as("authenticated", ALICE, `UPDATE users SET name = '  ' WHERE user_id = '${ALICE}'`));
  await assert.rejects(as("authenticated", ALICE, `UPDATE users SET name = repeat('a', 101) WHERE user_id = '${ALICE}'`));
  await as("authenticated", ALICE, `UPDATE users SET name = repeat('a', 100) WHERE user_id = '${ALICE}'`);
});

test("signup: nama terlalu panjang dipotong ke 100 karakter, signup tidak gagal", async () => {
  await db.exec(
    `INSERT INTO auth.users VALUES ('${id(2)}', 'bob@ugm.ac.id', '{"name":"${"b".repeat(150)}"}')`
  );
  const [u] = (await db.query(`SELECT char_length(name) AS n FROM users WHERE user_id = '${id(2)}'`)).rows;
  assert.equal(Number(u.n), 100);
});
