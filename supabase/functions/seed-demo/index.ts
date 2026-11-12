// Edge Function: isi / hapus DATA DEMO untuk Campus Dashboard. Hanya akun ber-role admin.
// Mahasiswa demo memakai email @demo.instride.test sehingga mudah dikenali dan dihapus.
// Hapus = hapus akun demo; mood, jurnal, dan sentimennya ikut terhapus (ON DELETE CASCADE).
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const DOMAIN = "@demo.instride.test";
const STUDENTS = 24;
const WEEKS = 8;

const JOURNALS: [string, "Positif" | "Netral" | "Negatif"][] = [
  ["Presentasi kelompok lancar, dosen memberi masukan yang membangun.", "Positif"],
  ["Hari ini kuliah seperti biasa, lalu mengerjakan laporan praktikum.", "Netral"],
  ["Tugas menumpuk dan aku kurang tidur, rasanya capek sekali.", "Negatif"],
  ["Senang bisa makan malam bareng teman kos setelah ujian.", "Positif"],
  ["Cemas menunggu nilai UTS keluar minggu depan.", "Negatif"],
  ["Ikut rapat organisasi, membahas program kerja semester ini.", "Netral"],
  ["Akhirnya revisi proposal disetujui pembimbing, lega.", "Positif"],
  ["Kepikiran terus soal tenggat skripsi, susah fokus.", "Negatif"],
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = Deno.env.get("SUPABASE_URL")!;
  const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: auth } = await asUser.auth.getUser();
  if (!auth.user) return json({ error: "unauthorized" }, 401);
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: me } = await admin.from("users").select("role").eq("user_id", auth.user.id).single();
  if (me?.role !== "admin") return json({ error: "hanya admin" }, 403);

  const { action } = await req.json().catch(() => ({ action: "" }));

  // Selalu hapus demo lama dulu agar "seed" bisa diulang tanpa duplikat
  let removed = 0;
  for (let page = 1; page < 20; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const demo = (data?.users ?? []).filter((u) => u.email?.endsWith(DOMAIN));
    for (const u of demo) if (!(await admin.auth.admin.deleteUser(u.id)).error) removed++;
    if (!data || data.users.length < 200) break;
  }
  if (action === "clear") return json({ removed });
  if (action !== "seed") return json({ error: "action harus seed atau clear" }, 400);

  const now = Date.now();
  const day = 86_400_000;
  const moods: { user_id: string; mood_value: number; recorded_at: string }[] = [];
  const journals: { user_id: string; content: string; created_at: string; sentiment: string }[] = [];

  for (let n = 1; n <= STUDENTS; n++) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: `mahasiswa${n}${DOMAIN}`,
      email_confirm: true,
      user_metadata: { name: `Mahasiswa Demo ${n}` },
    });
    if (error || !created.user) return json({ error: `gagal membuat akun demo: ${error?.message}` }, 500);
    const id = created.user.id;
    const base = 2.6 + (n % 5) * 0.35; // tiap mahasiswa punya kecenderungan mood berbeda
    for (let d = WEEKS * 7 - 1; d >= 0; d--) {
      if ((n * 7 + d * 3) % 10 < 4) continue; // ~60% hari tercatat
      const wave = Math.sin((d + n) / 6) * 0.9; // naik turun alami per minggu
      const value = Math.max(1, Math.min(5, Math.round(base + wave + (((n + d) % 3) - 1) * 0.5)));
      const at = new Date(now - d * day - ((n * 37) % 600) * 60_000).toISOString();
      moods.push({ user_id: id, mood_value: value, recorded_at: at });
      if ((n + d) % 2 === 0) {
        const pool = JOURNALS.filter(([, s]) => (value >= 4 ? s !== "Negatif" : value <= 2 ? s !== "Positif" : true));
        const [content, sentiment] = pool[(n + d) % pool.length];
        journals.push({ user_id: id, content, created_at: at, sentiment });
      }
    }
  }

  const { error: mErr } = await admin.from("moods").insert(moods);
  if (mErr) return json({ error: mErr.message }, 500);
  const { data: inserted, error: jErr } = await admin
    .from("journals")
    .insert(journals.map(({ sentiment: _s, ...j }) => j))
    .select("journal_id, created_at");
  if (jErr || !inserted) return json({ error: jErr?.message }, 500);
  const { error: sErr } = await admin.from("sentiment_analysis").insert(
    inserted.map((j, i) => ({ journal_id: j.journal_id, sentiment: journals[i].sentiment, analyzed_at: j.created_at })),
  );
  if (sErr) return json({ error: sErr.message }, 500);
  await admin.rpc("refresh_wellbeing_aggregation"); // arsip mingguan; dashboard tetap real-time

  return json({ removed, students: STUDENTS, moods: moods.length, journals: journals.length });
});
