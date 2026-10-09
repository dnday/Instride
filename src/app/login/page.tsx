"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { mapSignInError } from "@/lib/authErrors";
import { type FieldErrors, validateLogin } from "@/lib/authValidation";
import { AUTHENTICATED_DESTINATION } from "@/lib/constants";
import { getSupabaseClient, SupabaseConfigError } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    // 1. Validate
    const result = validateLogin({ email, password });
    setFieldErrors(result.errors);
    if (!result.ok) return;

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

      // 3. Sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        const mapped = mapSignInError(signInError);
        setFormError(mapped.message);
        return;
      }

      // 4. Session persisted by the client; navigate.
      router.push(AUTHENTICATED_DESTINATION);
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
          Masuk ke Instride
        </h1>

        {formError && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-800" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Belum punya akun?{" "}
          <Link href="/register" className="text-[#4FA7A1] font-semibold hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}
