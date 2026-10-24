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
    <section className="bg-white rounded-lg border p-6">
      <h2 className="font-semibold text-gray-900">Mood Hari Ini</h2>
      <p className="mt-1 text-sm text-gray-500">Bagaimana perasaanmu hari ini? (1 sampai 5)</p>

      {confirmed && (
        <p className="mt-3 rounded bg-green-50 p-2 text-sm text-green-800" role="status">
          Mood hari ini sudah tercatat.
        </p>
      )}

      {formError && (
        <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-800" role="alert">
          {formError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-4">
        <div
          role="radiogroup"
          aria-label="Pilih mood 1 sampai 5"
          aria-invalid={fieldErrors.mood ? "true" : undefined}
          aria-describedby={fieldErrors.mood ? "mood-error" : undefined}
          className="flex gap-2"
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

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 w-full rounded-md bg-[#4FA7A1] py-2.5 text-sm font-semibold text-white hover:bg-[#3E8C87] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4FA7A1]"
        >
          {submitting ? "Memproses..." : "Simpan Mood"}
        </button>
      </form>
    </section>
  );
}
