import type { SupabaseClient, User } from "@supabase/supabase-js";

// Cek sesi tanpa bolak-balik jaringan. getSession() membaca sesi tersimpan di browser (token diperbarui
// otomatis oleh supabase-js); getUser() selalu memanggil server Auth (~0,3-0,6 detik per halaman).
// Ini hanya untuk memilih halaman/arah redirect. Keamanan data tetap ditegakkan RLS di database,
// yang memverifikasi token pada setiap query.
export async function currentUser(supabase: SupabaseClient): Promise<User | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

export type Profile = { role: string | null; name: string | null };
const key = (userId: string) => `instride:profile:${userId}`;

/** Role & nama, disimpan sementara per tab (sessionStorage) agar pindah halaman tidak query ulang. */
export async function loadProfile(supabase: SupabaseClient, userId: string): Promise<Profile> {
  try {
    const cached = sessionStorage.getItem(key(userId));
    if (cached) return JSON.parse(cached) as Profile;
  } catch {
    /* sessionStorage bisa diblokir; lanjut query */
  }
  const { data } = await supabase.from("users").select("role, name").eq("user_id", userId).single();
  const profile: Profile = { role: (data?.role as string) ?? null, name: (data?.name as string) ?? null };
  try {
    if (data) sessionStorage.setItem(key(userId), JSON.stringify(profile));
  } catch {
    /* abaikan */
  }
  return profile;
}

/** Dipanggil setelah nama diubah atau saat keluar, supaya cache tidak basi. */
export function clearProfileCache() {
  try {
    for (const k of Object.keys(sessionStorage)) if (k.startsWith("instride:profile:")) sessionStorage.removeItem(k);
  } catch {
    /* abaikan */
  }
}
