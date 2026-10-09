import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Error thrown when the Supabase client cannot be initialized because a
 * required environment variable is missing or empty. The offending variable
 * name is exposed via `missingVar` so callers can surface it.
 */
export class SupabaseConfigError extends Error {
  constructor(public readonly missingVar: string) {
    super(`Konfigurasi Supabase tidak lengkap: ${missingVar} belum di-set.`);
    this.name = "SupabaseConfigError";
  }
}

let client: SupabaseClient | null = null;

function readRequiredEnv(varName: string, raw: string | undefined): string {
  if (raw == null || raw.trim() === "") {
    throw new SupabaseConfigError(varName);
  }
  return raw;
}

/**
 * Returns the shared browser Supabase client, creating it on first call and
 * reusing the same instance thereafter.
 *
 * Throws {@link SupabaseConfigError} naming the first missing environment
 * variable when configuration is incomplete; in that case no client is
 * created and no network request is issued.
 */
export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const url = readRequiredEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const anonKey = readRequiredEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return client;
}

/** Test-only helper to reset the memoized client between cases. */
export function __resetSupabaseClientForTests(): void {
  client = null;
}
