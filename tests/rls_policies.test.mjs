// @vitest-environment node
// Uji RLS per-role (spec: role-based-rls-policies) terhadap semua migration via PGlite.
// Mencakup R1-R10 dan TC-RBAC. Jalankan: npm run test:run
import { test, beforeAll } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const dir = new URL("../supabase/migrations/", import.meta.url);
const db = new PGlite();
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const ALICE = id(1);   // mahasiswa
const BOB = id(2);     // mahasiswa lain
const KONSELOR = id(99);

async function setupStub() {
  await db.exec(`
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}');
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
      AS $$ SELECT nullif(current_setting('test.uid', true), '')::uuid $$;
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
    GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
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

const signup = (n, name = "", meta = "") =>
  db.exec(
    `INSERT INTO auth.users VALUES ('${id(n)}', 'u${n}@ugm.ac.id', '{"name":"${name}"${meta}}')`
  );

beforeAll(async () => {
  await setupStub();
  for (const f of fs.readdirSync(dir).sort()) await db.exec(fs.readFileSync(new URL(f, dir), "utf8"));
  await db.exec(`
    GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
    GRANT UPDATE, DELETE ON public.moods, public.journals TO authenticated;
    GRANT UPDATE ON public.users TO authenticated;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO service_role;
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
  `);
  await signup(99, "Konselor");
  await db.exec(`UPDATE public.users SET role = 'konselor' WHERE user_id = '${KONSELOR}'`);
  await signup(1, "Alice");
  await signup(2, "Bob");
  await as("authenticated", ALICE, `INSERT INTO moods (user_id, mood_value) VALUES ('${ALICE}', 3)`);
  await as("authenticated", ALICE, `INSERT INTO journals (user_id, content) VALUES ('${ALICE}', 'rahasia')`);
  await as("authenticated", BOB, `INSERT INTO moods (user_id, mood_value) VALUES ('${BOB}', 4)`);
}, 60_000);

test("R10.1: mahasiswa bisa CRUD moods & journals milik sendiri", async () => {
  const moods = await as("authenticated", ALICE, "SELECT * FROM moods");
  assert.equal(moods.length, 1);
  await as("authenticated", ALICE, `UPDATE moods SET mood_value = 5 WHERE user_id = '${ALICE}'`);
  const [upd] = await as("authenticated", ALICE, "SELECT mood_value FROM moods");
  assert.equal(Number(upd.mood_value), 5);
  await as("authenticated", ALICE, `DELETE FROM journals WHERE user_id = '${ALICE}'`);
  const j = await as("authenticated", ALICE, "SELECT * FROM journals");
  assert.equal(j.length, 0);
});

test("R10.2: mahasiswa tidak bisa baca/ubah data orang lain", async () => {
  const visible = await as("authenticated", ALICE, "SELECT * FROM moods");
  assert.ok(visible.every((m) => m.user_id === ALICE));
  await as("authenticated", ALICE, `UPDATE moods SET mood_value = 1 WHERE user_id = '${BOB}'`);
  const [bob] = (await db.query(`SELECT mood_value FROM moods WHERE user_id = '${BOB}'`)).rows;
  assert.equal(Number(bob.mood_value), 4);
  assert.equal((await as("authenticated", KONSELOR, "SELECT * FROM moods")).length, 0);
  assert.equal((await as("authenticated", KONSELOR, "SELECT * FROM journals")).length, 0);
});

test("Property 3 / R10.3: role & user_id immutable oleh mahasiswa", async () => {
  for (const attempt of ["konselor", "admin", "mahasiswa"]) {
    await as("authenticated", ALICE, `UPDATE users SET role = '${attempt}' WHERE user_id = '${ALICE}'`);
    const [u] = await as("authenticated", ALICE, "SELECT role FROM users");
    assert.equal(u.role, "mahasiswa");
  }
  await as("authenticated", ALICE, `UPDATE users SET name = 'Alice Baru' WHERE user_id = '${ALICE}'`);
  const [n] = await as("authenticated", ALICE, "SELECT name FROM users");
  assert.equal(n.name, "Alice Baru");
});

test("R10.5: set_user_role hanya via service_role", async () => {
  await assert.rejects(as("authenticated", ALICE, `SELECT set_user_role('${BOB}', 'konselor')`));
  await as("service_role", null, `SELECT set_user_role('${BOB}', 'konselor')`);
  const [b] = (await db.query(`SELECT role FROM users WHERE user_id = '${BOB}'`)).rows;
  assert.equal(b.role, "konselor");
  await as("service_role", null, `SELECT set_user_role('${BOB}', 'mahasiswa')`);
});

test("R6.3/6.4/6.5: set_user_role invalid/missing/idempoten", async () => {
  await assert.rejects(as("service_role", null, `SELECT set_user_role('${ALICE}', 'superadmin')`));
  const [a] = (await db.query(`SELECT role FROM users WHERE user_id = '${ALICE}'`)).rows;
  assert.equal(a.role, "mahasiswa");
  await as("service_role", null, `SELECT set_user_role('${id(123)}', 'admin')`);
  await as("service_role", null, `SELECT set_user_role('${KONSELOR}', 'konselor')`);
  await as("service_role", null, `SELECT set_user_role('${KONSELOR}', 'konselor')`);
  const [k] = (await db.query(`SELECT role FROM users WHERE user_id = '${KONSELOR}'`)).rows;
  assert.equal(k.role, "konselor");
});

test("Property 4 / R5.5: signup selalu role=mahasiswa meski metadata memaksa", async () => {
  await signup(60, "Nakal", `,"role":"admin"`);
  const [u] = (await db.query(`SELECT role FROM public.users WHERE user_id = '${id(60)}'`)).rows;
  assert.equal(u.role, "mahasiswa");
});

test("Property 6 / R9.4: re-apply migration idempoten", async () => {
  const mig = new URL("20261010000000_role_based_rls_policies.sql", dir);
  const sql = fs.readFileSync(mig, "utf8");
  await db.exec(sql);
  const [p] = (await db.query(`SELECT count(*)::int AS count FROM pg_policies WHERE tablename = 'moods' AND policyname = 'Users can update own moods'`)).rows;
  assert.equal(Number(p.count), 1);
});

test("R9.1: RLS aktif di semua tabel", async () => {
  const rows = (await db.query(`
    SELECT tablename, rowsecurity FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('users', 'moods', 'journals', 'sentiment_analysis', 'wellbeing_aggregation')
  `)).rows;
  assert.equal(rows.length, 5);
  assert.ok(rows.every((r) => r.rowsecurity === true));
});
