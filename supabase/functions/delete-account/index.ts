// Edge Function: menghapus akun pemanggil beserta seluruh datanya (hak penghapusan data pribadi, UU 27/2022).
// Hanya akun pemanggil sendiri (diambil dari JWT), bukan user_id dari body.
// public.users -> moods, journals -> sentiment_analysis ikut terhapus lewat ON DELETE CASCADE.
// Statistik kampus yang sudah diarsipkan tetap ada karena hanya berisi angka agregat tanpa identitas.
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: auth } = await asUser.auth.getUser();
  if (!auth.user) return json({ error: "unauthorized" }, 401);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await admin.auth.admin.deleteUser(auth.user.id);
  if (error) return json({ error: error.message }, 500);
  return json({ deleted: true });
});
