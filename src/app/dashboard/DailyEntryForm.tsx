"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { isOverLimit, JOURNAL_CHAR_LIMIT, validateJournal } from "@/lib/journalValidation";
import { mapSaveError } from "@/lib/moodJournalErrors";
import { validateMood } from "@/lib/moodValidation";
import { getSupabaseClient } from "@/lib/supabaseClient";

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

  const over = isOverLimit(content);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);
    setSavedNow(false);

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
    <section className="bg-white rounded-lg border p-6">
      <h2 className="font-semibold text-gray-900">Bagaimana harimu?</h2>
      <p className="mt-1 text-sm text-gray-500">Pilih mood, lalu tulis jurnal bila ingin (opsional).</p>

      {savedNow && (
        <p className="mt-3 rounded bg-green-50 p-2 text-sm text-green-800" role="status">
          Catatan harian tersimpan.
        </p>
      )}
      {!savedNow && alreadyToday && (
        <p className="mt-3 rounded bg-green-50 p-2 text-sm text-green-800" role="status">
          Kamu sudah mencatat hari ini. Kamu tetap bisa menambah catatan lagi.
        </p>
      )}
      {formError && (
        <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-800" role="alert">
          {formError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-5" noValidate>
        <fieldset>
          <legend className="text-sm font-medium text-gray-700">
            Mood <span className="text-red-600">*</span>
          </legend>
          <div
            role="radiogroup"
            aria-label="Pilih mood 1 sampai 5"
            aria-invalid={fieldErrors.mood ? "true" : undefined}
            aria-describedby={fieldErrors.mood ? "mood-error" : undefined}
            className="mt-2 flex gap-2"
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
                  className={`h-12 w-12 rounded-full border text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4FA7A1] ${
                    active
                      ? "bg-[#4FA7A1] text-white border-[#4FA7A1]"
                      : "bg-white text-gray-700 border-gray-300 hover:border-[#4FA7A1]"
                  }`}
                >
                  {v}
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
          <label htmlFor="journal" className="block text-sm font-medium text-gray-700">
            Jurnal <span className="font-normal text-gray-400">(opsional)</span>
          </label>
          <textarea
            id="journal"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Hari ini saya merasa..."
            aria-invalid={fieldErrors.content ? "true" : undefined}
            aria-describedby={fieldErrors.content ? "journal-error" : undefined}
            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4FA7A1] ${
              fieldErrors.content || over ? "border-red-500" : "border-gray-300"
            }`}
          />
          <div className="mt-1 flex items-center justify-between">
            {fieldErrors.content ? (
              <p id="journal-error" className="text-xs text-red-600" role="alert">
                {fieldErrors.content}
              </p>
            ) : (
              <span />
            )}
            <span className={`text-xs ${over ? "text-red-600 font-semibold" : "text-gray-400"}`}>
              {content.length}/{JOURNAL_CHAR_LIMIT}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-[#4FA7A1] py-2.5 text-sm font-semibold text-white hover:bg-[#3E8C87] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4FA7A1]"
        >
          {submitting ? "Menyimpan..." : "Simpan Catatan"}
        </button>
      </form>
    </section>
  );
}
