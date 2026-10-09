/** A validatable auth form field. */
export type Field = "name" | "email" | "password";

/** Map of field name to its Indonesian validation message. */
export type FieldErrors = Partial<Record<Field, string>>;

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ValidationResult {
  /** True when no field violates its rule. */
  ok: boolean;
  errors: FieldErrors;
}

/** Indonesian validation messages, matching VALIDATION_RULES.md. */
export const MESSAGES = {
  nameRequired: "Field name wajib diisi",
  emailRequired: "Field email wajib diisi",
  emailInvalid: "Format email tidak valid",
  passwordRequired: "Field password wajib diisi",
} as const;

/**
 * Returns true when `email` has a non-empty local part, a single `@`, and a
 * non-empty domain containing a dot. Whitespace-only and malformed values
 * return false.
 */
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (trimmed === "") return false;
  const at = trimmed.indexOf("@");
  // exactly one "@", not first or last char
  if (at <= 0 || at !== trimmed.lastIndexOf("@")) return false;
  const domain = trimmed.slice(at + 1);
  if (domain === "" || !domain.includes(".")) return false;
  // no whitespace inside
  if (/\s/.test(trimmed)) return false;
  // domain must not start/end with a dot
  if (domain.startsWith(".") || domain.endsWith(".")) return false;
  return true;
}

function isEmpty(value: string): boolean {
  return value.trim() === "";
}

/**
 * Validates register input. All failing fields are reported in one pass.
 */
export function validateRegister(input: RegisterInput): ValidationResult {
  const errors: FieldErrors = {};

  if (isEmpty(input.name)) errors.name = MESSAGES.nameRequired;

  if (isEmpty(input.email)) {
    errors.email = MESSAGES.emailRequired;
  } else if (!isValidEmail(input.email)) {
    errors.email = MESSAGES.emailInvalid;
  }

  if (isEmpty(input.password)) errors.password = MESSAGES.passwordRequired;

  return { ok: Object.keys(errors).length === 0, errors };
}

/**
 * Validates login input. All failing fields are reported in one pass.
 */
export function validateLogin(input: LoginInput): ValidationResult {
  const errors: FieldErrors = {};

  if (isEmpty(input.email)) {
    errors.email = MESSAGES.emailRequired;
  } else if (!isValidEmail(input.email)) {
    errors.email = MESSAGES.emailInvalid;
  }

  if (isEmpty(input.password)) errors.password = MESSAGES.passwordRequired;

  return { ok: Object.keys(errors).length === 0, errors };
}
