import { describe, expect, test } from "vitest";
import { AUTH_ERROR_MESSAGES, isExistingUserSignUp, mapSignInError, mapSignUpError } from "./authErrors";
import { mapSaveError, SAVE_ERROR_MESSAGES } from "./moodJournalErrors";

describe("mapSignInError", () => {
  test("email belum dikonfirmasi tidak dilaporkan sebagai password salah", () => {
    expect(mapSignInError({ code: "email_not_confirmed", message: "Email not confirmed" }).message).toBe(
      AUTH_ERROR_MESSAGES.emailNotConfirmed,
    );
  });

  test("kredensial salah", () => {
    expect(mapSignInError({ message: "Invalid login credentials" }).kind).toBe("invalid_credentials");
  });

  test("rate limit punya pesan sendiri, bukan 'server tidak terhubung'", () => {
    expect(mapSignInError({ status: 429, message: "Request rate limit reached" }).kind).toBe("rate_limited");
  });

  test("kegagalan jaringan -> service_unavailable", () => {
    expect(mapSignInError({ name: "AuthRetryableFetchError", message: "Failed to fetch" }).kind).toBe("service_unavailable");
  });
});

describe("mapSignUpError", () => {
  test("email sudah terdaftar", () => {
    expect(mapSignUpError({ message: "User already registered" }).kind).toBe("email_in_use");
  });

  test("password lemah dari Supabase diterjemahkan, pesan Inggris tidak bocor", () => {
    const m = mapSignUpError({ code: "weak_password", message: "Password should be at least 6 characters." });
    expect(m.message).toBe(AUTH_ERROR_MESSAGES.weakPassword);
  });

  test("trigger profil gagal -> profile_failed", () => {
    expect(mapSignUpError({ message: "Database error saving new user" }).kind).toBe("profile_failed");
  });

  test("error lain tidak menampilkan pesan mentah", () => {
    expect(mapSignUpError({ message: "Some internal English error" }).message).toBe(AUTH_ERROR_MESSAGES.unknown);
  });
});

describe("isExistingUserSignUp", () => {
  test("identities kosong berarti email sudah terdaftar", () => {
    expect(isExistingUserSignUp({ identities: [] })).toBe(true);
    expect(isExistingUserSignUp({ identities: [{}] })).toBe(false);
    expect(isExistingUserSignUp({})).toBe(false);
  });
});

describe("mapSaveError", () => {
  test("JWT kedaluwarsa -> sesi berakhir", () => {
    expect(mapSaveError({ code: "PGRST301", message: "JWT expired" }).message).toBe(SAVE_ERROR_MESSAGES.noSession);
  });

  test("CHECK isi jurnal -> pesan validasi", () => {
    expect(mapSaveError({ code: "23514", message: 'violates check constraint "journals_content_check"' }).kind).toBe(
      "invalid_content",
    );
  });
});
