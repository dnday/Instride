"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { AUTH_ERROR_MESSAGES, isExistingUserSignUp, mapSignUpError } from "@/lib/authErrors";
import { type FieldErrors, validateRegister } from "@/lib/authValidation";
import { destinationForRole } from "@/lib/constants";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { getSupabaseClient, SupabaseConfigError } from "@/lib/supabaseClient";

const CONSENT_REQUIRED = "Persetujuan pemrosesan data wajib dicentang untuk mendaftar";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Persetujuan eksplisit: jurnal & mood termasuk data kesehatan (data pribadi spesifik, UU 27/2022)
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setNotice(null);

    // 1. Validate
    const result = validateRegister({ name, email, password });
    setFieldErrors(result.errors);
    setConsentError(consent ? null : CONSENT_REQUIRED);
    if (!result.ok || !consent) return;

    // 2. Loading
    setLoading(true);

    try {
      let supabase: ReturnType<typeof getSupabaseClient>;
      try {
        supabase = getSupabaseClient();
      } catch (cfg) {
        if (cfg instanceof SupabaseConfigError) {
          setFormError(cfg.message);
          return;
        }
        throw cfg;
      }

      // 3. Sign up
      // Profil public.users dibuat otomatis oleh trigger on_auth_user_created (Issue #8) dari metadata name
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim(), consent_at: new Date().toISOString() } },
      });

      if (signUpError) {
        const mapped = mapSignUpError(signUpError);
        setFormError(mapped.message);
        return;
      }

      const user = data.user;
      if (!user) {
        setFormError("Registrasi tidak dapat diselesaikan.");
        return;
      }

      // 5. Branch on session
      if (isExistingUserSignUp(user)) {
        // Konfirmasi email aktif: Supabase tidak mengembalikan error untuk email terdaftar
        setFormError(AUTH_ERROR_MESSAGES.emailInUse);
      } else if (data.session) {
        const { data: me } = await supabase
          .from("users")
          .select("role")
          .eq("user_id", user.id)
          .single();
        router.push(destinationForRole((me?.role as string | null) ?? null));
      } else {
        // Email confirmation required
        setNotice(
          "Registrasi berhasil! Silakan cek email untuk konfirmasi, kemudian masuk melalui halaman login."
        );
      }
    } catch {
      setFormError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-6 inline-flex min-h-11 items-center font-serif text-2xl font-semibold text-brand-900">Instride</Link>
      <div className="w-full max-w-md card sm:p-8">
        <h1 className="font-serif text-3xl font-semibold text-center text-ink mb-6">
          Buat Akun Instride
        </h1>

        {notice && (
          <div className="mb-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-900" role="status">
            <p>{notice}</p>
            <Link
              href="/login"
              className="font-semibold text-brand-700 underline"
            >
              Ke halaman login
            </Link>
          </div>
        )}

        {formError && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
            {formError}
          </div>
        )}

        <div className="mb-6 rounded-xl border border-brand-100 bg-surface p-3">
          <label className="flex items-start gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (e.target.checked) setConsentError(null);
              }}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[#2A7470]"
              aria-invalid={consentError ? "true" : undefined}
              aria-describedby={consentError ? "consent-error" : undefined}
            />
            <span>
              Saya menyetujui mood dan jurnal saya diproses untuk analisis sentimen dan statistik kampus yang anonim,
              sesuai{" "}
              <Link href="/privasi" className="font-semibold text-brand-700 underline">
                Kebijakan Privasi
              </Link>
              .
            </span>
          </label>
          {consentError && (
            <p id="consent-error" className="mt-2 text-xs text-red-600" role="alert">
              {consentError}
            </p>
          )}
        </div>

        {consent ? (
          <GoogleSignInButton label="Daftar dengan Google" />
        ) : (
          <p className="rounded-xl border border-dashed border-brand-100 py-2.5 text-center text-sm text-muted">
            Centang persetujuan di atas untuk daftar dengan Google
          </p>
        )}
        <div className="my-6 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-brand-100" />
          atau dengan email
          <span className="h-px flex-1 bg-brand-100" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Nama */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink">
              Nama
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`field mt-1 ${fieldErrors.name ? "border-red-500" : ""}`}
              aria-invalid={fieldErrors.name ? "true" : undefined}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
            />
            {fieldErrors.name && (
              <p id="name-error" className="mt-1 text-xs text-red-600" role="alert">
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`field mt-1 ${fieldErrors.email ? "border-red-500" : ""}`}
              aria-invalid={fieldErrors.email ? "true" : undefined}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
            />
            {fieldErrors.email && (
              <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`field mt-1 ${fieldErrors.password ? "border-red-500" : ""}`}
              aria-invalid={fieldErrors.password ? "true" : undefined}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
            />
            {fieldErrors.password && (
              <p id="password-error" className="mt-1 text-xs text-red-600" role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn w-full"
          >
            {loading ? "Memproses..." : "Daftar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink">
          Sudah punya akun?{" "}
          <Link href="/login" className="inline-flex min-h-11 items-center font-semibold text-brand-700 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
