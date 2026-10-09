/** Category of a mapped auth error. */
export type AuthErrorKind =
  | "email_in_use"
  | "invalid_credentials"
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
  serviceUnavailable: "Tidak dapat terhubung ke server. Coba lagi beberapa saat lagi.",
  profileFailed: "Pengaturan akun belum selesai. Silakan coba lagi.",
  unknown: "Terjadi kesalahan. Silakan coba lagi.",
} as const;

function errorMessageOf(err: unknown): string {
  if (err != null && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "";
}

/**
 * Maps a Supabase sign-up error to a user-facing message. A "already
 * registered" error becomes `email_in_use`; any other reason surfaces its
 * message as `unknown`.
 */
export function mapSignUpError(err: unknown): MappedError {
  const raw = errorMessageOf(err).toLowerCase();
  if (
    raw.includes("already registered") ||
    raw.includes("already exists") ||
    raw.includes("user already") ||
    raw.includes("email already")
  ) {
    return { kind: "email_in_use", message: AUTH_ERROR_MESSAGES.emailInUse };
  }
  const original = errorMessageOf(err);
  return {
    kind: "unknown",
    message: original !== "" ? original : AUTH_ERROR_MESSAGES.unknown,
  };
}

/**
 * Maps a Supabase sign-in failure. Invalid login responses become
 * `invalid_credentials` (covering both wrong password and unknown email, so
 * neither is distinguishable); thrown/transport failures become
 * `service_unavailable`.
 */
export function mapSignInError(err: unknown): MappedError {
  const raw = errorMessageOf(err).toLowerCase();
  if (
    raw.includes("invalid login") ||
    raw.includes("invalid credentials") ||
    raw.includes("email not confirmed") ||
    raw.includes("wrong")
  ) {
    return {
      kind: "invalid_credentials",
      message: AUTH_ERROR_MESSAGES.invalidCredentials,
    };
  }
  // No recognized credential signal -> treat as service/transport failure.
  return {
    kind: "service_unavailable",
    message: AUTH_ERROR_MESSAGES.serviceUnavailable,
  };
}

/** Error shown when the auth user was created but the profile row failed. */
export function profileSetupError(): MappedError {
  return { kind: "profile_failed", message: AUTH_ERROR_MESSAGES.profileFailed };
}
