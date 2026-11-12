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
import { hasCrisisLanguage } from "@/lib/crisis";
import { CrisisNotice } from "@/components/CrisisNotice";

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
  const [needsHelp, setNeedsHelp] = useState(false);

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
      setNeedsHelp(hasCrisisLanguage(content));
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
    <section className="card">
      <h2 className="font-serif text-xl font-semibold text-ink">Jurnal hari ini</h2>
      <p className="mt-1 text-sm text-muted">Tuliskan apa yang terjadi dan apa yang kamu rasakan.</p>

      {confirmed && (
        <p className="mt-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-900" role="status">
          Jurnal hari ini sudah tercatat.
        </p>
      )}

      {needsHelp && <CrisisNotice />}

      {formError && (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
          {formError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder="Ceritakan harimu..."
          aria-label="Isi jurnal"
          aria-invalid={fieldErrors.content ? "true" : undefined}
          aria-describedby={fieldErrors.content ? "journal-error" : undefined}
          className={`w-full rounded-xl border bg-surface px-4 py-3 text-base leading-relaxed text-ink placeholder:text-muted ${
            fieldErrors.content ? "border-red-500" : "border-brand-100"
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
                <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              Hanya kamu yang bisa membaca jurnal ini
            </span>
          )}
          <span className={`text-xs ${over ? "text-red-600 font-semibold" : "text-muted"}`}>
            {content.length}/{JOURNAL_CHAR_LIMIT}
          </span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn mt-4 w-full"
        >
          {submitting ? "Memproses..." : "Simpan Jurnal"}
        </button>
      </form>
    </section>
  );
}
