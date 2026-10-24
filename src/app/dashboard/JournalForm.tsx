"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { mapSaveError } from "@/lib/moodJournalErrors";
import {
  type JournalFieldErrors,
  JOURNAL_CHAR_LIMIT,
  isOverLimit,
  validateJournal,
} from "@/lib/journalValidation";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function JournalForm({
  alreadyToday,
  onSaved,
}: {
  userId: string;
  alreadyToday: boolean;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [fieldErrors, setFieldErrors] = useState<JournalFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(alreadyToday);

  const over = isOverLimit(content);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);

    const result = validateJournal({ content });
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
        .from("journals")
        .insert({ user_id: auth.user.id, content });
      if (error) {
        setFormError(mapSaveError(error).message);
        return;
      }
      setContent("");
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
      <h2 className="font-semibold text-gray-900">Jurnal Hari Ini</h2>
      <p className="mt-1 text-sm text-gray-500">Tuliskan apa yang kamu rasakan hari ini.</p>

      {confirmed && (
        <p className="mt-3 rounded bg-green-50 p-2 text-sm text-green-800" role="status">
          Jurnal hari ini sudah tercatat.
        </p>
      )}

      {formError && (
        <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-800" role="alert">
          {formError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder="Hari ini saya merasa..."
          aria-invalid={fieldErrors.content ? "true" : undefined}
          aria-describedby={fieldErrors.content ? "journal-error" : undefined}
          className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4FA7A1] ${
            fieldErrors.content ? "border-red-500" : "border-gray-300"
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

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 w-full rounded-md bg-[#4FA7A1] py-2.5 text-sm font-semibold text-white hover:bg-[#3E8C87] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4FA7A1]"
        >
          {submitting ? "Memproses..." : "Simpan Jurnal"}
        </button>
      </form>
    </section>
  );
}
