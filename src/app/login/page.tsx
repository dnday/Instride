"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { mapSignInError } from "@/lib/authErrors";
import { type FieldErrors, validateLogin } from "@/lib/authValidation";
import { destinationForRole } from "@/lib/constants";
import GoogleSignInButton from "@/components/GoogleSignInButton";
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
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      let role: string | null = null;
      if (uid) {
        const { data: me } = await supabase
          .from("users")
          .select("role")
          .eq("user_id", uid)
          .single();
        role = (me?.role as string | null) ?? null;
      }
      router.push(destinationForRole(role));
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
          Masuk ke Instride
        </h1>

        {formError && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
            {formError}
          </div>
        )}

        <GoogleSignInButton />
        <div className="my-6 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-brand-100" />
          atau dengan email
          <span className="h-px flex-1 bg-brand-100" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink">
          Belum punya akun?{" "}
          <Link href="/register" className="inline-flex min-h-11 items-center font-semibold text-brand-700 hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}
