"use client";

import { useEffect, useState } from "react";

import { currentUser, loadProfile } from "@/lib/session";
import { getSupabaseClient } from "@/lib/supabaseClient";

/** Hanya untuk admin: isi atau hapus data demo (24 mahasiswa @demo.instride.test, 8 minggu). */
export function DemoControls() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [busy, setBusy] = useState<"seed" | "clear" | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    currentUser(supabase).then(async (u) => u && setIsAdmin((await loadProfile(supabase, u.id)).role === "admin"));
  }, []);

  if (!isAdmin) return null;

  async function run(action: "seed" | "clear") {
    setBusy(action);
    setNote(null);
    const { data, error } = await getSupabaseClient().functions.invoke("seed-demo", { body: { action } });
    setBusy(null);
    if (error || data?.error) return setNote(`Gagal: ${data?.error ?? error?.message ?? "coba lagi"}`);
    if (action === "seed") {
      setNote(`Data demo dibuat: ${data.students} mahasiswa, ${data.moods} mood, ${data.journals} jurnal. Memuat ulang…`);
      setTimeout(() => window.location.reload(), 1200);
    } else {
      setNote(`${data.removed} akun demo dihapus. Memuat ulang…`);
      setTimeout(() => window.location.reload(), 1200);
    }
  }

  return (
    <section className="rounded-2xl border border-dashed border-brand-100 bg-white p-5">
      <h2 className="font-semibold text-ink">Data demo (khusus admin)</h2>
      <p className="mt-1 text-sm text-muted">
        Membuat 24 mahasiswa fiktif (email @demo.instride.test) dengan mood dan jurnal 8 minggu terakhir agar dashboard
        bisa dicoba. Hapus sebelum dipakai sungguhan karena ikut terhitung di statistik.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn" disabled={busy !== null} onClick={() => run("seed")}>
          {busy === "seed" ? "Membuat data… (±30 detik)" : "Isi data demo"}
        </button>
        <button type="button" className="btn-ghost" disabled={busy !== null} onClick={() => run("clear")}>
          {busy === "clear" ? "Menghapus…" : "Hapus data demo"}
        </button>
      </div>
      {note && <p className="mt-3 text-sm text-ink" role="status">{note}</p>}
    </section>
  );
}
