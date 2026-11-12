"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { ErrorNote, Loading, type Session, StudentPage, useStudent } from "@/components/StudentShell";
import { MESSAGES, NAME_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/authValidation";

type Note = { ok: boolean; text: string } | null;

export default function ProfilPage() {
  const auth = useStudent();
  return (
    <StudentPage title="Profil & Pengaturan" intro="Kelola data akun dan preferensimu.">
      {auth.status === "error" && <ErrorNote message={auth.message} />}
      {auth.status === "loading" && <Loading />}
      {auth.status === "ready" && <Settings supabase={auth.supabase} user={auth.user} />}
    </StudentPage>
  );
}

function Settings({ supabase, user }: Session) {
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [nameNote, setNameNote] = useState<Note>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passNote, setPassNote] = useState<Note>(null);
  const [reminder, setReminder] = useState<boolean>(user.user_metadata?.daily_reminder === true);
  const [reminderNote, setReminderNote] = useState<Note>(null);
  const [busy, setBusy] = useState<"name" | "pass" | "reminder" | null>(null);

  useEffect(() => {
    supabase.from("users").select("name").eq("user_id", user.id).single().then(({ data }) => {
      setName(data?.name ?? "");
      setSavedName(data?.name ?? "");
    });
  }, [supabase, user.id]);

  async function saveName(e: FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (!value) return setNameNote({ ok: false, text: MESSAGES.nameRequired });
    if (value.length > NAME_MAX_LENGTH) return setNameNote({ ok: false, text: MESSAGES.nameTooLong });
    setBusy("name");
    // Hanya kolom name yang boleh diubah user (email & role dijaga trigger database)
    const { error } = await supabase.from("users").update({ name: value }).eq("user_id", user.id);
    setBusy(null);
    if (error) return setNameNote({ ok: false, text: "Nama gagal disimpan. Coba lagi." });
    setSavedName(value);
    setName(value);
    setNameNote({ ok: true, text: "Nama tersimpan." });
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    if (password.length < PASSWORD_MIN_LENGTH) return setPassNote({ ok: false, text: MESSAGES.passwordTooShort });
    if (password !== confirm) return setPassNote({ ok: false, text: "Konfirmasi password tidak sama" });
    setBusy("pass");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(null);
    if (error) return setPassNote({ ok: false, text: "Password gagal diubah. Coba masuk ulang lalu ulangi." });
    setPassword("");
    setConfirm("");
    setPassNote({ ok: true, text: "Password berhasil diubah." });
  }

  async function toggleReminder() {
    const next = !reminder;
    setReminder(next);
    setBusy("reminder");
    // ponytail: preferensi saja (disimpan di metadata akun); pengiriman notifikasinya belum ada
    const { error } = await supabase.auth.updateUser({ data: { daily_reminder: next } });
    setBusy(null);
    if (error) {
      setReminder(!next);
      return setReminderNote({ ok: false, text: "Preferensi gagal disimpan." });
    }
    setReminderNote({ ok: true, text: next ? "Pengingat harian aktif." : "Pengingat harian nonaktif." });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <form onSubmit={saveName} className="card space-y-4" noValidate>
        <div aria-hidden="true" className="grid h-16 w-16 place-items-center rounded-full bg-brand-50 font-serif text-2xl font-semibold text-brand-900">
          {(savedName || user.email || "?").charAt(0).toUpperCase()}
        </div>
        <div>
          <label htmlFor="name" className="label">Nama lengkap</label>
          <input id="name" className="field" value={name} maxLength={255} autoComplete="name"
            aria-describedby={nameNote ? "name-note" : undefined} aria-invalid={nameNote?.ok === false || undefined}
            onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <p className="label">Email</p>
          <p className="break-all text-sm text-ink">{user.email}</p>
        </div>
        <FormNote id="name-note" note={nameNote} />
        <button type="submit" className="btn" disabled={busy === "name" || name.trim() === savedName}>
          {busy === "name" ? "Menyimpan..." : "Simpan nama"}
        </button>
      </form>

      <div className="lg:col-span-2 space-y-4">
        <form onSubmit={savePassword} className="card space-y-4" noValidate>
          <h2 className="font-semibold text-ink">Ubah password</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="label">Password baru</label>
              <input id="password" type="password" className="field" value={password} autoComplete="new-password"
                aria-describedby={passNote ? "pass-note" : undefined} aria-invalid={passNote?.ok === false || undefined}
                onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <label htmlFor="confirm" className="label">Ulangi password baru</label>
              <input id="confirm" type="password" className="field" value={confirm} autoComplete="new-password"
                onChange={(e) => setConfirm(e.target.value)} />
            </div>
          </div>
          <FormNote id="pass-note" note={passNote} />
          <button type="submit" className="btn" disabled={busy === "pass" || !password}>
            {busy === "pass" ? "Menyimpan..." : "Simpan password"}
          </button>
        </form>

        <section className="card">
          <h2 className="font-semibold text-ink">Preferensi</h2>
          <div className="mt-3 flex items-center justify-between gap-4">
            <span id="reminder-label" className="text-sm text-ink">Pengingat harian untuk mencatat mood</span>
            <button type="button" role="switch" aria-checked={reminder} aria-labelledby="reminder-label"
              disabled={busy === "reminder"} onClick={toggleReminder}
              className="grid h-11 w-14 shrink-0 place-items-center disabled:opacity-60">
              <span className={`flex h-7 w-12 items-center rounded-full p-0.5 transition-colors ${reminder ? "bg-brand-700" : "bg-gray-300"}`}>
                <span className={`h-6 w-6 rounded-full bg-white transition-transform motion-reduce:transition-none ${reminder ? "translate-x-5" : ""}`} />
              </span>
            </button>
          </div>
          <FormNote id="reminder-note" note={reminderNote} />
        </section>

        <DataSection supabase={supabase} user={user} />
      </div>
    </div>
  );
}

/** Hak penghapusan data (UU 27/2022): konfirmasi dua langkah di halaman, tanpa dialog browser. */
function DataSection({ supabase, user }: Session) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<"entries" | "account" | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);

  async function run() {
    setBusy(true);
    setNote(null);
    try {
      if (confirming === "entries") {
        // RLS hanya mengizinkan menghapus baris milik sendiri; sentimen ikut terhapus (ON DELETE CASCADE)
        const [m, j] = await Promise.all([
          supabase.from("moods").delete().eq("user_id", user.id),
          supabase.from("journals").delete().eq("user_id", user.id),
        ]);
        if (m.error || j.error) throw new Error();
        setNote({ ok: true, text: "Semua mood dan jurnalmu sudah dihapus." });
      } else {
        const { error } = await supabase.functions.invoke("delete-account", { body: {} });
        if (error) throw error;
        await supabase.auth.signOut();
        router.replace("/");
        return;
      }
      setConfirming(null);
    } catch {
      setNote({ ok: false, text: "Penghapusan gagal. Periksa koneksi lalu coba lagi." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2 className="font-semibold text-ink">Data saya</h2>
      <p className="mt-1 text-sm text-ink">
        Kamu bisa menghapus data kapan saja. Penghapusan bersifat permanen dan tidak bisa dibatalkan. Lihat{" "}
        <Link href="/privasi" className="font-semibold text-brand-700 underline">Kebijakan Privasi</Link>.
      </p>
      {confirming ? (
        <div role="alert" className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-ink">
          <p className="font-semibold">
            {confirming === "entries"
              ? "Hapus semua mood, jurnal, dan hasil analisisnya?"
              : "Hapus akun beserta semua mood dan jurnal?"}
          </p>
          <p className="mt-1">Tindakan ini permanen.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn bg-negative hover:bg-negative" disabled={busy} onClick={run}>
              {busy ? "Menghapus..." : "Ya, hapus permanen"}
            </button>
            <button type="button" className="btn-ghost" disabled={busy} onClick={() => setConfirming(null)}>
              Batal
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" onClick={() => setConfirming("entries")}>
            Hapus semua catatan
          </button>
          <button type="button" className="btn-ghost text-negative border-negative" onClick={() => setConfirming("account")}>
            Hapus akun
          </button>
        </div>
      )}
      <FormNote id="data-note" note={note} />
    </section>
  );
}

function FormNote({ id, note }: { id: string; note: Note }) {
  if (!note) return null;
  return (
    <p id={id} role={note.ok ? "status" : "alert"} className={`text-sm ${note.ok ? "text-brand-700" : "text-red-600"}`}>
      {note.text}
    </p>
  );
}
