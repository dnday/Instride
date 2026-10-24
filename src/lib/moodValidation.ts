/** Validatable mood field. */
export type MoodField = "mood";

/** Map of mood field to its Indonesian validation message. */
export type MoodFieldErrors = Partial<Record<MoodField, string>>;

/** Raw value from the selector: a number when chosen, or null when not. */
export interface MoodInput {
  mood: number | null;
}

export interface MoodValidationResult {
  /** True when the mood value is valid. */
  ok: boolean;
  errors: MoodFieldErrors;
}

/** Indonesian validation messages, matching VALIDATION_RULES.md. */
export const MOOD_MESSAGES = {
  moodRequired: "Mood wajib diisi",
  moodRange: "Mood harus bernilai antara 1 sampai 5",
} as const;

/**
 * Validates a mood value. Rejects null (not chosen) with moodRequired;
 * rejects non-integer or out-of-range values with moodRange; accepts an
 * integer in 1..5 inclusive.
 */
export function validateMood(input: MoodInput): MoodValidationResult {
  const errors: MoodFieldErrors = {};
  const { mood } = input;

  if (mood === null || mood === undefined) {
    errors.mood = MOOD_MESSAGES.moodRequired;
  } else if (!Number.isInteger(mood) || mood < 1 || mood > 5) {
    errors.mood = MOOD_MESSAGES.moodRange;
  }

  return { ok: Object.keys(errors).length === 0, errors };
}
