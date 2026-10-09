// Eksekusi otomatis test case validasi di TEST_CASES.md (TC-AUTH-002..005, TC-AUTH-007..009)
import { describe, expect, test } from "vitest";
import { MESSAGES, validateLogin, validateRegister } from "./authValidation";

const valid = { name: "Nama Mahasiswa", email: "mahasiswa@example.com", password: "password123" };

describe("Register", () => {
  test("data valid lolos validasi (prasyarat TC-AUTH-001)", () => {
    expect(validateRegister(valid)).toEqual({ ok: true, errors: {} });
  });

  test("TC-AUTH-002 name kosong ditolak dengan error pada field name", () => {
    const r = validateRegister({ ...valid, name: "   " });
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual({ name: MESSAGES.nameRequired });
  });

  test("TC-AUTH-003 email kosong ditolak dengan error pada field email", () => {
    const r = validateRegister({ ...valid, email: "" });
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual({ email: MESSAGES.emailRequired });
  });

  test.each(["mahasiswa", "mahasiswa@", "@example.com", "a@b", "a@@example.com", "a b@example.com", "a@example."])(
    "TC-AUTH-004 format email tidak valid ditolak: %s",
    (email) => {
      const r = validateRegister({ ...valid, email });
      expect(r.ok).toBe(false);
      expect(r.errors).toEqual({ email: MESSAGES.emailInvalid });
    },
  );

  test("TC-AUTH-005 password kosong ditolak dengan error pada field password", () => {
    const r = validateRegister({ ...valid, password: "" });
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual({ password: MESSAGES.passwordRequired });
  });

  test("beberapa field kosong dilaporkan sekaligus (VALIDATION_RULES 5)", () => {
    expect(validateRegister({ name: "", email: "x", password: "" }).errors).toEqual({
      name: MESSAGES.nameRequired,
      email: MESSAGES.emailInvalid,
      password: MESSAGES.passwordRequired,
    });
  });
});

describe("Login", () => {
  const login = { email: valid.email, password: valid.password };

  test("data valid lolos validasi (prasyarat TC-AUTH-006)", () => {
    expect(validateLogin(login)).toEqual({ ok: true, errors: {} });
  });

  test("TC-AUTH-007 email kosong ditolak dengan error pada field email", () => {
    expect(validateLogin({ ...login, email: " " }).errors).toEqual({ email: MESSAGES.emailRequired });
  });

  test("TC-AUTH-008 format email tidak valid ditolak dengan error pada field email", () => {
    expect(validateLogin({ ...login, email: "mahasiswa.example.com" }).errors).toEqual({ email: MESSAGES.emailInvalid });
  });

  test("TC-AUTH-009 password kosong ditolak dengan error pada field password", () => {
    expect(validateLogin({ ...login, password: "" }).errors).toEqual({ password: MESSAGES.passwordRequired });
  });
});
