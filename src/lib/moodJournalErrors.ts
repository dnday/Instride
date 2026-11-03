/** Category of a mapped save error. */
export type SaveErrorKind =
  | "no_session"
  | "service_unavailable"
  | "permission_denied"
  | "invalid_content"
  | "unknown";

export interface MappedError {
  kind: SaveErrorKind;
  message: string;
}

export const SAVE_ERROR_MESSAGES = {
  noSession: "Sesi kamu telah berakhir. Silakan masuk kembali.",
  serviceUnavailable: "Tidak dapat terhubung ke server. Coba lagi beberapa saat lagi.",
  permissionDenied: "Kamu tidak memiliki izin untuk menyimpan entri ini.",
  invalidContent: "Jurnal tidak boleh kosong dan maksimal 5000 karakter.",
  unknown: "Gagal menyimpan. Silakan coba lagi.",
} as const;

function errorText(err: unknown): string {
  if (err != null && typeof err === "object") {
    const e = err as { message?: unknown; code?: unknown };
    const parts = [];
    if (typeof e.message === "string") parts.push(e.message);
    if (typeof e.code === "string") parts.push(e.code);
    return parts.join(" ").toLowerCase();
  }
  return "";
}

/**
 * Maps a Supabase insert error (moods/journals) to an Indonesian message.
 * Expired/invalid JWT (PGRST301, PGRST303, "jwt expired") -> no_session.
 * RLS/permission (e.g. code 42501 or "row-level security") -> permission_denied.
 * CHECK violation on the journal content (23514) -> invalid_content.
 * Transport/network failure -> service_unavailable. Everything else -> unknown.
 */
export function mapSaveError(err: unknown): MappedError {
  const raw = errorText(err);

  if (raw.includes("pgrst301") || raw.includes("pgrst303") || raw.includes("jwt")) {
    return { kind: "no_session", message: SAVE_ERROR_MESSAGES.noSession };
  }
  if (raw.includes("23514") || raw.includes("journals_content_check")) {
    return { kind: "invalid_content", message: SAVE_ERROR_MESSAGES.invalidContent };
  }
  if (raw.includes("42501") || raw.includes("row-level security") || raw.includes("permission denied")) {
    return { kind: "permission_denied", message: SAVE_ERROR_MESSAGES.permissionDenied };
  }
  if (
    raw.includes("fetch") ||
    raw.includes("network") ||
    raw.includes("timeout") ||
    raw.includes("failed to fetch")
  ) {
    return { kind: "service_unavailable", message: SAVE_ERROR_MESSAGES.serviceUnavailable };
  }
  return { kind: "unknown", message: SAVE_ERROR_MESSAGES.unknown };
}
