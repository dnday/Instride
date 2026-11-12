"use client";

import { AnimatePresence, m } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { isOverLimit, JOURNAL_CHAR_LIMIT, validateJournal } from "@/lib/journalValidation";
import { mapSaveError } from "@/lib/moodJournalErrors";
import { validateMood } from "@/lib/moodValidation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { hasCrisisLanguage } from "@/lib/crisis";
import { CrisisNotice } from "@/components/CrisisNotice";
import { Icon, type IconName } from "@/components/Icon";
import { MoodFace } from "@/components/MoodFace";
import { enterEase, springSoft } from "@/components/Motion";
import { MOOD_COLORS, MOOD_LABELS } from "@/lib/mood";
import { appendDictation, useDictation } from "@/lib/useDictation";

const MOOD_OPTIONS = [1, 2, 3, 4, 5] as const;

/** Tip singkat setelah menyimpan, menyesuaikan waktu (dasar: kebersihan tidur & jeda singkat, lihat /bantuan). */
function tipFor(hour = new Date().getHours()): { icon: IconName; title: string; text: string } {
  if (hour >= 18 || hour < 4)
    return { icon: "moon", title: "Rehat malam", text: "Coba jauhkan layar sekitar satu jam sebelum tidur." };
  if (hour < 11) return { icon: "sun", title: "Awal yang pelan", text: "Tulis satu hal kecil yang ingin kamu selesaikan hari ini." };
  return { icon: "leaf", title: "Jeda sebentar", text: "Latihan napas 1 menit di halaman Bantuan bisa membantu di tengah hari yang padat." };
}

type FieldErrors = { mood?: string; content?: string };

/**
 * Satu form untuk mood (wajib) dan jurnal (opsional). Keduanya disimpan lewat
 * RPC save_daily_entry dalam satu transaksi, jadi tidak ada data setengah jadi.
 */
export default function DailyEntryForm({
  alreadyToday,
  onSaved,
}: {
  alreadyToday: boolean;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [mood, setMood] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savedNow, setSavedNow] = useState(false);
  const [needsHelp, setNeedsHelp] = useState(false);
  const [saved, setSaved] = useState<{ mood: number; time: string; withJournal: boolean } | null>(null);

  const over = isOverLimit(content);
  const dictation = useDictation((spoken) => setContent((c) => appendDictation(c, spoken)));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    dictation.stop();
    setFormError(null);
    setSavedNow(false);
    setNeedsHelp(false);

    // Validasi semua field sekaligus agar semua pesan muncul bersamaan
    const moodResult = validateMood({ mood });
    const journalResult = validateJournal({ content }, { optional: true });
    const errors: FieldErrors = { ...moodResult.errors, ...journalResult.errors };
    setFieldErrors(errors);
    if (!moodResult.ok || !journalResult.ok) return;

    setSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace("/login");
        return;
      }
      const { error } = await supabase.rpc("save_daily_entry", {
        p_mood: mood,
        // Jurnal kosong dikirim sebagai null supaya hanya mood yang tersimpan
        p_content: content.trim() === "" ? null : content,
      });
      if (error) {
        const mapped = mapSaveError(error);
        if (mapped.kind === "no_session") {
          router.replace("/login");
          return;
        }
        // Isian tetap dipertahankan supaya pengguna tidak perlu mengetik ulang
        setFormError(mapped.message);
        return;
      }
      // Rujukan krisis dicek di perangkat saja; hasilnya tidak disimpan
      setNeedsHelp(hasCrisisLanguage(content));
      setSaved({
        mood: mood as number,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        withJournal: content.trim() !== "",
      });
      setMood(null);
      setContent("");
      setFieldErrors({});
      setSavedNow(true);
      onSaved?.();
    } catch {
      setFormError("Gagal menyimpan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- Layar sukses (desain Stitch "Catatan Tersimpan"), teks disesuaikan dengan kenyataan ----------
  if (savedNow && saved) {
    const color = MOOD_COLORS[saved.mood];
    return (
      <m.section
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: enterEase }}
        className="card card-raised relative overflow-hidden rounded-3xl px-6 py-8 text-center sm:px-10"
        role="status"
      >
        <m.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...springSoft, delay: 0.05 }}
          className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-brand-50"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-16 w-16">
            <circle cx="12" cy="12" r="11" fill="#1F4E4B" />
            <path className="check-draw" d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </m.div>
        <h2 className="mt-6 font-serif text-3xl font-semibold text-brand-900">Catatan harian tersimpan.</h2>
        <p className="mx-auto mt-2 max-w-xs text-lg leading-relaxed text-ink">Terima kasih sudah meluangkan waktu untuk dirimu.</p>

        <div className="mt-6 rounded-2xl bg-surface p-5 text-left">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-ink">Suasana hati terpilih</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm shadow-sm">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: color.fill }} />
              <strong>{MOOD_LABELS[saved.mood]}</strong>
              <span className="tnum text-muted">(skala {saved.mood}/5)</span>
            </span>
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Icon name="lock" className="h-4 w-4" />
            Tersimpan pukul <span className="tnum">{saved.time}</span>
            {saved.withJournal ? " · jurnal hanya bisa kamu baca" : ""}
          </p>
        </div>

        {needsHelp && <div className="text-left"><CrisisNotice /></div>}

        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-brand-50/60 p-4 text-left">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-brand-700"><Icon name={tipFor().icon} className="h-5 w-5" /></span>
          <span>
            <span className="block font-semibold text-ink">{tipFor().title}</span>
            <span className="block text-sm leading-relaxed text-ink">{tipFor().text}</span>
          </span>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2">
          <Link href="/ringkasan" className="btn w-full min-h-12 text-base">
            Lihat tren mingguan <Icon name="arrowRight" className="h-5 w-5" />
          </Link>
          <button type="button" onClick={() => setSavedNow(false)} className="inline-flex min-h-11 items-center gap-2 px-3 text-sm font-semibold text-brand-700 hover:underline">
            <Icon name="pen" className="h-4 w-4" /> Tulis catatan lagi
          </button>
        </div>
      </m.section>
    );
  }

  // ---------- Form (desain Stitch "Catatan Harian") ----------
  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {alreadyToday && (
        <p className="flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-900" role="status">
          <Icon name="check" className="h-4 w-4 shrink-0" />
          Kamu sudah mencatat hari ini. Kamu tetap bisa menambah catatan lagi.
        </p>
      )}
      <AnimatePresence initial={false}>
        {formError && (
          <m.p key="err" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {formError}
          </m.p>
        )}
      </AnimatePresence>

      <section className="card card-raised rounded-3xl">
        <fieldset>
          <legend className="font-serif text-2xl font-semibold text-brand-900">Bagaimana harimu?</legend>
          <p className="mt-1 text-ink">Pilih yang paling mewakili suasana hatimu. Tidak ada jawaban yang salah.</p>
          <div
            role="radiogroup"
            aria-label="Pilih mood 1 sampai 5"
            aria-invalid={fieldErrors.mood ? "true" : undefined}
            aria-describedby={fieldErrors.mood ? "mood-error" : undefined}
            className="mt-5 grid grid-cols-5 gap-1 sm:gap-3"
          >
            {MOOD_OPTIONS.map((v) => {
              const active = mood === v;
              const color = MOOD_COLORS[v];
              return (
                <m.button
                  type="button"
                  key={v}
                  role="radio"
                  aria-checked={active}
                  aria-label={`Mood ${v} - ${MOOD_LABELS[v]}`}
                  onClick={() => setMood(v)}
                  whileTap={{ scale: 0.94 }}
                  className="flex min-h-11 flex-col items-center gap-2 rounded-2xl py-1"
                >
                  <m.span
                    className="relative grid place-items-center rounded-full"
                    animate={{ scale: active ? 1.08 : 1, boxShadow: active ? `0 0 0 3px ${color.fill}` : "0 0 0 0px rgba(0,0,0,0)" }}
                    transition={springSoft}
                  >
                    <MoodFace value={v} className="h-12 w-12 sm:h-16 sm:w-16" />
                    <AnimatePresence>
                      {active && (
                        <m.span
                          key="cek"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={springSoft}
                          aria-hidden="true"
                          className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full text-white ring-2 ring-white"
                          style={{ background: color.fill }}
                        >
                          <Icon name="check" className="h-3 w-3" />
                        </m.span>
                      )}
                    </AnimatePresence>
                  </m.span>
                  <span className={`text-center text-xs leading-tight sm:text-sm ${active ? "font-semibold text-ink" : "text-muted"}`}>{MOOD_LABELS[v]}</span>
                </m.button>
              );
            })}
          </div>
          {fieldErrors.mood && (
            <p id="mood-error" className="mt-3 text-sm text-red-600" role="alert">
              {fieldErrors.mood}
            </p>
          )}
        </fieldset>
      </section>

      <section className="card card-raised rounded-3xl">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="journal" className="flex items-center gap-2 font-serif text-2xl font-semibold text-brand-900">
            <Icon name="notes" className="h-6 w-6 text-brand-700" />
            Jurnal
          </label>
          <span className="rounded-full bg-surface px-3 py-1 text-sm font-medium text-muted ring-1 ring-brand-100">Opsional</span>
        </div>
        <p className="mt-1 text-ink">Tuangkan beban pikiran, rasa syukur, atau apa pun yang terlintas.</p>

        <div className={`mt-4 rounded-2xl bg-surface ring-1 transition-shadow focus-within:ring-2 focus-within:ring-brand-700 ${
          fieldErrors.content || over ? "ring-red-500" : "ring-brand-100"
        }`}>
          <textarea
            id="journal"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Ceritakan harimu… Ada hal yang membebani atau yang kamu syukuri hari ini?"
            aria-invalid={fieldErrors.content ? "true" : undefined}
            aria-describedby={fieldErrors.content ? "journal-error" : undefined}
            className="block w-full resize-y rounded-2xl bg-transparent px-5 pt-4 text-base leading-relaxed text-ink placeholder:font-serif placeholder:italic placeholder:text-muted focus:outline-none"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-3">
            {dictation.supported ? (
              <button
                type="button"
                onClick={dictation.toggle}
                aria-pressed={dictation.listening}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-150 ${
                  dictation.listening ? "bg-[#F6DED6] text-negative" : "bg-brand-100 text-brand-900 hover:bg-[#b9e3de]"
                }`}
              >
                <span className="relative grid h-5 w-5 place-items-center">
                  {dictation.listening && <span className="absolute inset-0 rounded-full bg-negative/30 motion-safe:animate-ping" />}
                  <Icon name="mic" className="relative h-4 w-4" />
                </span>
                {dictation.listening ? "Berhenti" : "Dikte suara"}
              </button>
            ) : (
              <span />
            )}
            {dictation.listening && (
              <span className="text-sm text-negative" role="status" aria-live="polite">
                Mendengarkan… {dictation.interim && <span className="italic text-muted">{dictation.interim}</span>}
              </span>
            )}
          </div>
        </div>
        {dictation.error && (
          <p className="mt-2 text-sm text-red-600" role="alert">{dictation.error}</p>
        )}
        <div className="mt-3 flex items-center justify-between gap-3">
          {fieldErrors.content ? (
            <p id="journal-error" className="text-sm text-red-600" role="alert">{fieldErrors.content}</p>
          ) : (
            <span className="flex items-center gap-2 text-sm text-muted">
              <Icon name="lock" className="h-4 w-4" />
              Hanya kamu yang bisa membaca jurnal ini
            </span>
          )}
          <span className={`tnum text-sm ${over ? "font-semibold text-red-600" : "text-muted"}`}>
            {content.length}/{JOURNAL_CHAR_LIMIT}
          </span>
        </div>
      </section>

      <aside className="flex items-center gap-4 rounded-3xl bg-brand-50/70 px-5 py-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-brand-700"><Icon name="leaf" className="h-5 w-5" /></span>
        <p className="font-serif text-lg italic leading-snug text-ink">“Tidak apa-apa jika hari ini belum semua hal berjalan sempurna.”</p>
      </aside>

      <button type="submit" disabled={submitting} className="btn min-h-14 w-full text-base">
        <Icon name="checkCircle" className="h-5 w-5" />
        {submitting ? "Menyimpan..." : "Simpan Catatan"}
      </button>
    </form>
  );
}
