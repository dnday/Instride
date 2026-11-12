"use client";

import { AnimatePresence, m } from "framer-motion";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { isOverLimit, JOURNAL_CHAR_LIMIT, validateJournal } from "@/lib/journalValidation";
import { mapSaveError } from "@/lib/moodJournalErrors";
import { validateMood } from "@/lib/moodValidation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { hasCrisisLanguage } from "@/lib/crisis";
import { CrisisNotice } from "@/components/CrisisNotice";
import { MoodFace } from "@/components/MoodFace";
import { springSoft } from "@/components/Motion";
import { MOOD_COLORS, MOOD_LABELS } from "@/lib/mood";
import { appendDictation, useDictation } from "@/lib/useDictation";

const MOOD_OPTIONS = [1, 2, 3, 4, 5] as const;

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

  return (
    <section className="card">
      <h2 className="font-serif text-xl font-semibold text-ink">Bagaimana harimu?</h2>
      <p className="mt-1 text-sm text-muted">Pilih mood, lalu tulis jurnal bila ingin (opsional). Tidak ada jawaban yang salah.</p>

      <AnimatePresence initial={false}>
      {savedNow && (
        <m.p
          key="tersimpan"
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
          className="mt-3 flex items-center gap-3 rounded-xl bg-brand-50 p-3 text-sm font-medium text-brand-900"
          role="status"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 shrink-0">
            <circle cx="12" cy="12" r="11" fill="#2A7470" />
            <path className="check-draw" d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>
            <span className="block">Catatan harian tersimpan.</span>
            <span className="block font-normal">Terima kasih sudah meluangkan waktu untuk dirimu.</span>
          </span>
        </m.p>
      )}
      </AnimatePresence>
      {needsHelp && <CrisisNotice />}
      {!savedNow && alreadyToday && (
        <p className="mt-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-900" role="status">
          Kamu sudah mencatat hari ini. Kamu tetap bisa menambah catatan lagi.
        </p>
      )}
      {formError && (
        <p className="pop-in mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
          {formError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-5" noValidate>
        <fieldset>
          <legend className="text-sm font-medium text-ink">
            Mood <span className="text-red-600">*</span>
          </legend>
          <div
            role="radiogroup"
            aria-label="Pilih mood 1 sampai 5"
            aria-invalid={fieldErrors.mood ? "true" : undefined}
            aria-describedby={fieldErrors.mood ? "mood-error" : undefined}
            className="mt-2 grid grid-cols-5 gap-1 sm:gap-3"
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
                  title={MOOD_LABELS[v]}
                  onClick={() => setMood(v)}
                  whileTap={{ scale: 0.94 }}
                  className={`relative isolate flex min-h-11 flex-col items-center gap-1.5 rounded-2xl px-1 py-3 transition-colors duration-150 ${
                    active ? "text-ink" : "text-muted hover:bg-surface"
                  }`}
                >
                  {/* Sorotan berpindah antar-wajah (shared layout) dan berganti warna sesuai mood */}
                  {active && (
                    <m.span
                      layoutId="mood-highlight"
                      aria-hidden="true"
                      className="absolute inset-0 -z-10 rounded-2xl border-2"
                      initial={false}
                      animate={{ backgroundColor: color.tint, borderColor: color.fill }}
                      transition={springSoft}
                    />
                  )}
                  <m.span animate={{ scale: active ? 1.12 : 1, y: active ? -2 : 0 }} transition={springSoft}>
                    <MoodFace value={v} active={active} className="h-10 w-10 sm:h-12 sm:w-12" />
                  </m.span>
                  <span className={`text-center text-xs leading-tight ${active ? "font-semibold" : "font-medium"}`}>{MOOD_LABELS[v]}</span>
                </m.button>
              );
            })}
          </div>
          {fieldErrors.mood && (
            <p id="mood-error" className="mt-2 text-xs text-red-600" role="alert">
              {fieldErrors.mood}
            </p>
          )}
        </fieldset>

        <div>
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="journal" className="block text-sm font-medium text-ink">
              Jurnal <span className="font-normal text-muted">(opsional)</span>
            </label>
            {dictation.supported && (
              <button
                type="button"
                onClick={dictation.toggle}
                aria-pressed={dictation.listening}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
                  dictation.listening
                    ? "border-negative bg-[#F6DED6] text-negative"
                    : "border-brand-700 text-brand-900 hover:bg-brand-50"
                }`}
              >
                <span className="relative grid h-5 w-5 place-items-center">
                  {dictation.listening && <span className="absolute inset-0 rounded-full bg-negative/30 motion-safe:animate-ping" />}
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="relative h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="9" y="3" width="6" height="11" rx="3" />
                    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                  </svg>
                </span>
                {dictation.listening ? "Berhenti" : "Dikte suara"}
              </button>
            )}
          </div>
          <textarea
            id="journal"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder={dictation.supported ? "Ceritakan harimu, atau tekan Dikte suara lalu bicara..." : "Ceritakan harimu..."}
            aria-invalid={fieldErrors.content ? "true" : undefined}
            aria-describedby={fieldErrors.content ? "journal-error" : undefined}
            className={`mt-1 w-full rounded-xl border bg-surface px-4 py-3 text-base leading-relaxed text-ink placeholder:text-muted ${
              fieldErrors.content || over ? "border-red-500" : "border-brand-100"
            }`}
          />
          {dictation.listening && (
            <p className="mt-1 text-sm text-negative" role="status" aria-live="polite">
              Mendengarkan… {dictation.interim && <span className="italic text-muted">{dictation.interim}</span>}
            </p>
          )}
          {dictation.error && (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {dictation.error}
            </p>
          )}
          <div className="mt-1 flex items-center justify-between">
            {fieldErrors.content ? (
              <p id="journal-error" className="text-xs text-red-600" role="alert">
                {fieldErrors.content}
              </p>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                Hanya kamu yang bisa membaca jurnal ini
              </span>
            )}
            <span className={`text-xs ${over ? "text-red-600 font-semibold" : "text-muted"}`}>
              {content.length}/{JOURNAL_CHAR_LIMIT}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn w-full"
        >
          {submitting ? "Menyimpan..." : "Simpan Catatan"}
        </button>
      </form>
    </section>
  );
}
