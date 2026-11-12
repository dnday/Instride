"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { mapSaveError } from "@/lib/moodJournalErrors";
import { type MoodFieldErrors, validateMood } from "@/lib/moodValidation";
import { getSupabaseClient } from "@/lib/supabaseClient";

const MOOD_OPTIONS = [1, 2, 3, 4, 5] as const;
const MOOD_LABELS: Record<number, string> = {
  1: "Sangat buruk",
  2: "Buruk",
  3: "Biasa",
  4: "Baik",
  5: "Sangat baik",
};

export default function MoodForm({
  alreadyToday,
  onSaved,
}: {
  userId: string;
  alreadyToday: boolean;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<MoodFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(alreadyToday);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);

    const result = validateMood({ mood: selected });
    setFieldErrors(result.errors);
    if (!result.ok) return;

    setSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace("/login");
        return;
      }
      const { error } = await supabase
        .from("moods")
        .insert({ user_id: auth.user.id, mood_value: selected });
      if (error) {
        setFormError(mapSaveError(error).message);
        return;
      }
      setConfirmed(true);
      onSaved();
    } catch {
      setFormError("Gagal menyimpan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card">
      <h2 className="font-serif text-xl font-semibold text-ink">Bagaimana perasaanmu hari ini?</h2>
      <p className="mt-1 text-sm text-muted">Pilih yang paling mendekati. Tidak ada jawaban yang salah.</p>

      {confirmed && (
        <p className="mt-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-900" role="status">
          Mood hari ini sudah tercatat.
        </p>
      )}

      {formError && (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
          {formError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-5">
        <div
          role="radiogroup"
          aria-label="Pilih mood 1 sampai 5"
          aria-invalid={fieldErrors.mood ? "true" : undefined}
          aria-describedby={fieldErrors.mood ? "mood-error" : undefined}
          className="grid grid-cols-5 gap-1 sm:gap-3"
        >
          {MOOD_OPTIONS.map((v) => {
            const active = selected === v;
            return (
              <button
                type="button"
                key={v}
                role="radio"
                aria-checked={active}
                aria-label={`Mood ${v} - ${MOOD_LABELS[v]}`}
                onClick={() => setSelected(v)}
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

        <button type="submit" disabled={submitting} className="btn mt-5 w-full">
          {submitting ? "Memproses..." : "Simpan Mood"}
        </button>
      </form>
    </section>
  );
}

/** Wajah sederhana: lengkung mulut dari sedih (1) ke senang (5). */
function MoodFace({ value, active }: { value: number; active: boolean }) {
  const curve = (value - 3) * 2.2;
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="h-10 w-10 sm:h-12 sm:w-12">
      <circle cx="16" cy="16" r="14" fill={active ? "#CFE9E6" : "#F8FAFA"} stroke={active ? "#2A7470" : "#9AA5A2"} strokeWidth="1.6" />
      <circle cx="11.5" cy="13" r="1.6" fill={active ? "#1F4E4B" : "#56625F"} />
      <circle cx="20.5" cy="13" r="1.6" fill={active ? "#1F4E4B" : "#56625F"} />
      <path d={`M10 ${20 - curve / 2} Q16 ${20 + curve} 22 ${20 - curve / 2}`} fill="none"
        stroke={active ? "#1F4E4B" : "#56625F"} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
