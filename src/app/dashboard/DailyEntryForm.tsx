"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { isOverLimit, JOURNAL_CHAR_LIMIT, validateJournal } from "@/lib/journalValidation";
import { mapSaveError } from "@/lib/moodJournalErrors";
import { validateMood } from "@/lib/moodValidation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { hasCrisisLanguage } from "@/lib/crisis";
import { CrisisNotice } from "@/components/CrisisNotice";

const MOOD_OPTIONS = [1, 2, 3, 4, 5] as const;
const MOOD_LABELS: Record<number, string> = {
  1: "Sangat buruk",
  2: "Buruk",
  3: "Biasa",
  4: "Baik",
  5: "Sangat baik",
};

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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
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

      {savedNow && (
        <p className="mt-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-900" role="status">
          Catatan harian tersimpan.
        </p>
      )}
      {needsHelp && <CrisisNotice />}
      {!savedNow && alreadyToday && (
        <p className="mt-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-900" role="status">
          Kamu sudah mencatat hari ini. Kamu tetap bisa menambah catatan lagi.
        </p>
      )}
      {formError && (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
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
              return (
                <button
                  type="button"
                  key={v}
                  role="radio"
                  aria-checked={active}
                  aria-label={`Mood ${v} - ${MOOD_LABELS[v]}`}
                  title={MOOD_LABELS[v]}
                  onClick={() => setMood(v)}
                  className={`flex min-h-11 flex-col items-center gap-1.5 rounded-2xl border px-1 py-3 transition hover:-translate-y-px motion-reduce:transform-none ${
                    active ? "border-brand-700 bg-brand-50 text-brand-900" : "border-transparent text-muted hover:bg-surface"
                  }`}
                >
                  <MoodFace value={v} active={active} />
                  <span className="text-center text-xs font-medium leading-tight">{MOOD_LABELS[v]}</span>
                </button>
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
          <label htmlFor="journal" className="block text-sm font-medium text-ink">
            Jurnal <span className="font-normal text-muted">(opsional)</span>
          </label>
          <textarea
            id="journal"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Ceritakan harimu..."
            aria-invalid={fieldErrors.content ? "true" : undefined}
            aria-describedby={fieldErrors.content ? "journal-error" : undefined}
            className={`mt-1 w-full rounded-xl border bg-surface px-4 py-3 text-base leading-relaxed text-ink placeholder:text-muted ${
              fieldErrors.content || over ? "border-red-500" : "border-brand-100"
            }`}
          />
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

/** Wajah sederhana: lengkung mulut dari sedih (1) ke senang (5). */
function MoodFace({ value, active }: { value: number; active: boolean }) {
  const curve = (value - 3) * 2.2;
  const ink = active ? "#1F4E4B" : "#56625F";
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="h-10 w-10 sm:h-12 sm:w-12">
      <circle cx="16" cy="16" r="14" fill={active ? "#CFE9E6" : "#F8FAFA"} stroke={active ? "#2A7470" : "#9AA5A2"} strokeWidth="1.6" />
      <circle cx="11.5" cy="13" r="1.6" fill={ink} />
      <circle cx="20.5" cy="13" r="1.6" fill={ink} />
      <path d={`M10 ${20 - curve / 2} Q16 ${20 + curve} 22 ${20 - curve / 2}`} fill="none" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
