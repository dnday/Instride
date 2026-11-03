/** Category of a mapped auth error. */
export type AuthErrorKind =
  | "email_in_use"
  | "invalid_credentials"
  | "email_not_confirmed"
  | "weak_password"
  | "rate_limited"
  | "service_unavailable"
  | "profile_failed"
  | "unknown";

export interface MappedError {
  kind: AuthErrorKind;
  message: string;
}

export const AUTH_ERROR_MESSAGES = {
  emailInUse: "Email ini sudah terdaftar. Silakan gunakan email lain atau masuk.",
  invalidCredentials: "Email atau password salah.",
  emailNotConfirmed: "Email belum dikonfirmasi. Silakan buka link konfirmasi yang dikirim ke email kamu.",
  weakPassword: "Password terlalu lemah. Gunakan minimal 6 karakter.",
  rateLimited: "Terlalu banyak percobaan. Tunggu beberapa saat, lalu coba lagi.",
  serviceUnavailable: "Tidak dapat terhubung ke server. Coba lagi beberapa saat lagi.",
  profileFailed: "Pengaturan akun belum selesai. Silakan coba lagi.",
  unknown: "Terjadi kesalahan. Silakan coba lagi.",
} as const;

/** Lowercased `code` + `message` + `status` of a Supabase error, for matching. */
function errorText(err: unknown): string {
  if (err == null || typeof err !== "object") return "";
  const e = err as { message?: unknown; code?: unknown; status?: unknown };
  return [e.code, e.message, e.status]
    .filter((v) => typeof v === "string" || typeof v === "number")
    .join(" ")
    .toLowerCase();
}

const has = (raw: string, ...needles: string[]) => needles.some((n) => raw.includes(n));

const isRateLimited = (raw: string) => has(raw, "rate limit", "rate_limit", "too many", "429");
const isNetwork = (raw: string) => has(raw, "fetch", "network", "timeout", "authretryablefetcherror");

/**
 * Maps a Supabase sign-up error to a user-facing Indonesian message.
 * Raw (English) Supabase messages are never shown to the user.
 */
export function mapSignUpError(err: unknown): MappedError {
  const raw = errorText(err);
  if (has(raw, "already registered", "already exists", "user already", "email already", "user_already_exists", "email_exists")) {
    return { kind: "email_in_use", message: AUTH_ERROR_MESSAGES.emailInUse };
  }
  if (has(raw, "weak_password", "password should", "password must")) {
    return { kind: "weak_password", message: AUTH_ERROR_MESSAGES.weakPassword };
  }
  if (isRateLimited(raw)) return { kind: "rate_limited", message: AUTH_ERROR_MESSAGES.rateLimited };
  // Trigger on_auth_user_created gagal membuat profil
  if (has(raw, "database error saving new user", "unexpected_failure")) {
    return { kind: "profile_failed", message: AUTH_ERROR_MESSAGES.profileFailed };
  }
  if (isNetwork(raw)) return { kind: "service_unavailable", message: AUTH_ERROR_MESSAGES.serviceUnavailable };
  return { kind: "unknown", message: AUTH_ERROR_MESSAGES.unknown };
}

/**
 * Maps a Supabase sign-in failure. Wrong password and unknown email both become
 * `invalid_credentials` so neither is distinguishable. An unconfirmed email gets
 * its own message instead of being reported as a wrong password.
 */
export function mapSignInError(err: unknown): MappedError {
  const raw = errorText(err);
  if (has(raw, "email not confirmed", "email_not_confirmed")) {
    return { kind: "email_not_confirmed", message: AUTH_ERROR_MESSAGES.emailNotConfirmed };
  }
  if (has(raw, "invalid login", "invalid credentials", "invalid_credentials", "wrong")) {
    return { kind: "invalid_credentials", message: AUTH_ERROR_MESSAGES.invalidCredentials };
  }
  if (isRateLimited(raw)) return { kind: "rate_limited", message: AUTH_ERROR_MESSAGES.rateLimited };
  if (isNetwork(raw) || raw === "") {
    return { kind: "service_unavailable", message: AUTH_ERROR_MESSAGES.serviceUnavailable };
  }
  return { kind: "unknown", message: AUTH_ERROR_MESSAGES.unknown };
}

/**
 * True when signUp returned a user without identities. With email confirmation
 * enabled, Supabase answers this way (instead of an error) for an email that is
 * already registered, to avoid revealing which emails exist.
 */
export function isExistingUserSignUp(user: { identities?: unknown[] | null } | null | undefined): boolean {
  return Array.isArray(user?.identities) && user.identities.length === 0;
}

/** Error shown when the auth user was created but the profile row failed. */
export function profileSetupError(): MappedError {
  return { kind: "profile_failed", message: AUTH_ERROR_MESSAGES.profileFailed };
}
