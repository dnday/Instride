// @vitest-environment node
// Uji RLS, anonimitas agregat, dan trigger signup terhadap semua migration (PostgreSQL in-memory via PGlite).
// Jalankan: npm run test:run
import { test, beforeAll } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const dir = new URL("../supabase/migrations/", import.meta.url);
const db = new PGlite();
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const KONSELOR = id(99);

// Stub minimal Supabase: schema auth, auth.uid() dari setting sesi, role anon/authenticated
async function setupSupabaseStub() {
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

const signup = (n, name = "") =>
  db.exec(`INSERT INTO auth.users VALUES ('${id(n)}', 'u${n}@ugm.ac.id', '{"name":"${name}"}')`);

beforeAll(async () => {
  await setupSupabaseStub();
  for (const f of fs.readdirSync(dir).sort()) await db.exec(fs.readFileSync(new URL(f, dir), "utf8"));
  // Hak default Supabase untuk role API
  await db.exec(`
    GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
  `);

  await signup(99, "Konselor");
  await db.exec(`UPDATE public.users SET role = 'konselor' WHERE user_id = '${KONSELOR}'`);
  // Minggu ini: 6 mahasiswa aktif. Dua minggu lalu: hanya 2 mahasiswa.
  for (let n = 1; n <= 7; n++) await signup(n, `Mahasiswa ${n}`);
  for (let n = 1; n <= 6; n++) {
    await db.exec(`
      INSERT INTO moods (user_id, mood_value) VALUES ('${id(n)}', ${(n % 5) + 1});
      INSERT INTO journals (user_id, content) VALUES ('${id(n)}', 'isi jurnal');
      INSERT INTO sentiment_analysis (journal_id, sentiment)
        VALUES (currval('journals_journal_id_seq'), '${n % 2 ? "Positif" : "Negatif"}');`);
  }
  for (const n of [6, 7])
    await db.exec(`INSERT INTO moods (user_id, mood_value, recorded_at) VALUES ('${id(n)}', 1, now() - interval '14 days')`);
}, 60_000);

test("signup otomatis membuat profil mahasiswa (Issue #8)", async () => {
  await db.exec(`INSERT INTO auth.users VALUES ('${id(50)}', 'nakal@ugm.ac.id', '{"name":" ","role":"konselor"}')`);
  const [u] = (await db.query(`SELECT name, role FROM public.users WHERE user_id = '${id(50)}'`)).rows;
  assert.equal(u.role, "mahasiswa", "role dari metadata signup harus diabaikan");
  assert.equal(u.name, "nakal", "nama kosong diambil dari email");
});

test("RLS users tidak rekursif dan hanya profil sendiri (FR4)", async () => {
  assert.equal((await as("authenticated", id(1), "SELECT * FROM users")).length, 1);
  assert.equal((await as("authenticated", KONSELOR, "SELECT * FROM users")).length, 1, "konselor tidak boleh lihat identitas mahasiswa");
});

test("mahasiswa tidak bisa menyimpan mood atas nama orang lain", async () => {
  await as("authenticated", id(1), `INSERT INTO moods (user_id, mood_value) VALUES ('${id(1)}', 3)`);
  await assert.rejects(as("authenticated", id(1), `INSERT INTO moods (user_id, mood_value) VALUES ('${id(2)}', 3)`));
  await assert.rejects(as("anon", null, `INSERT INTO moods (user_id, mood_value) VALUES ('${id(2)}', 3)`));
});

test("statistik kampus hanya untuk konselor", async () => {
  assert.equal((await as("authenticated", id(1), "SELECT * FROM campus_wellbeing_stats()")).length, 0);
  await assert.rejects(as("anon", null, "SELECT * FROM campus_wellbeing_stats()"));
});

test("k-anonymity: minggu dengan < 5 mahasiswa disembunyikan", async () => {
  const rows = await as("authenticated", KONSELOR, "SELECT * FROM campus_wellbeing_stats()");
  assert.equal(rows.length, 1, "hanya minggu dengan 6 mahasiswa yang tampil");
  assert.equal(Number(rows[0].active_students), 6);
  assert.equal(Number(rows[0].positive_percentage), 50);
});

test("agregasi terjadwal mengisi wellbeing_aggregation dan hanya bisa dijalankan sistem", async () => {
  await assert.rejects(as("authenticated", KONSELOR, "SELECT refresh_wellbeing_aggregation()"));
  const [{ refresh_wellbeing_aggregation: n }] = (await db.query("SELECT refresh_wellbeing_aggregation()")).rows;
  assert.equal(n, 1);
  await db.query("SELECT refresh_wellbeing_aggregation()"); // idempoten (upsert)
  const rows = await as("authenticated", KONSELOR, "SELECT * FROM wellbeing_aggregation");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].active_students, 6);
  assert.equal((await as("authenticated", id(1), "SELECT * FROM wellbeing_aggregation")).length, 0, "mahasiswa tidak boleh baca agregat");
});
