/** Validatable journal field. */
export type JournalField = "content";

/** Map of journal field to its Indonesian validation message. */
export type JournalFieldErrors = Partial<Record<JournalField, string>>;

export interface JournalInput {
  content: string;
}

export interface JournalValidationResult {
  /** True when the content is valid. */
  ok: boolean;
  errors: JournalFieldErrors;
}

/** Maximum allowed journal content length (confirmed decision). */
export const JOURNAL_CHAR_LIMIT = 5000;

/** Indonesian validation messages. */
export const JOURNAL_MESSAGES = {
  contentRequired: "Jurnal wajib diisi",
  contentTooLong: "Jurnal maksimal 5000 karakter",
} as const;

/**
 * Validates journal content. Rejects content that is empty after trimming
 * (contentRequired), and content whose raw length exceeds JOURNAL_CHAR_LIMIT
 * (contentTooLong). Accepts content with trimmed length >= 1 and raw length
 * <= the limit.
 */
export function validateJournal(input: JournalInput): JournalValidationResult {
  const errors: JournalFieldErrors = {};
  const { content } = input;

  if (content.trim().length === 0) {
    errors.content = JOURNAL_MESSAGES.contentRequired;
  } else if (content.length > JOURNAL_CHAR_LIMIT) {
    errors.content = JOURNAL_MESSAGES.contentTooLong;
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

/** True when content exceeds the character limit (for the live counter). */
export function isOverLimit(content: string): boolean {
  return content.length > JOURNAL_CHAR_LIMIT;
}
