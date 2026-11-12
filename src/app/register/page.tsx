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
    <div className="min-h-screen bg-[#F8FAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg border p-8">
        <h1 className="text-2xl font-bold text-center text-[#4FA7A1] mb-6">
          Buat Akun Instride
        </h1>

        {notice && (
          <div className="mb-4 rounded bg-green-50 p-3 text-sm text-green-800" role="status">
            <p>{notice}</p>
            <Link
              href="/login"
              className="underline font-semibold"
            >
              Ke halaman login
            </Link>
          </div>
        )}

        {formError && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-800" role="alert">
            {formError}
          </div>
        )}

        <div className="mb-6 rounded-md border border-gray-200 bg-gray-50 p-3">
          <label className="flex items-start gap-3 text-sm text-gray-700">
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
              <Link href="/privasi" className="font-semibold text-[#2A7470] underline">
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
          <p className="rounded-md border border-dashed border-gray-300 py-2.5 text-center text-sm text-gray-500">
            Centang persetujuan di atas untuk daftar dengan Google
          </p>
        )}
        <div className="my-6 flex items-center gap-3 text-xs text-gray-500">
          <span className="h-px flex-1 bg-gray-200" />
          atau dengan email
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Nama */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nama
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full mt-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4FA7A1] ${fieldErrors.name ? "border-red-500" : "border-gray-300"}`}
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
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full mt-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4FA7A1] ${fieldErrors.email ? "border-red-500" : "border-gray-300"}`}
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
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full mt-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4FA7A1] ${fieldErrors.password ? "border-red-500" : "border-gray-300"}`}
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
            className="w-full rounded-md bg-[#4FA7A1] py-2.5 text-sm font-semibold text-white uppercase tracking-wide hover:bg-[#3E8C87] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4FA7A1]"
          >
            {loading ? "Memproses..." : "Daftar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-[#4FA7A1] font-semibold hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
