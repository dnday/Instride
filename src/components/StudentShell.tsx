"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

import { CAMPUS_DESTINATION } from "@/lib/constants";
import { getSupabaseClient, SupabaseConfigError } from "@/lib/supabaseClient";

const NAV = [
  { href: "/dashboard", label: "Catatan" },
  { href: "/ringkasan", label: "Dashboard Saya" },
  { href: "/riwayat", label: "Riwayat" },
  { href: "/profil", label: "Profil" },
  { href: "/bantuan", label: "Bantuan" },
];

export type Session = { supabase: SupabaseClient; user: User };
type AuthState = { status: "loading" } | { status: "error"; message: string } | ({ status: "ready" } & Session);

/** Login wajib & khusus mahasiswa: tamu ke /login, konselor/admin ke Campus Dashboard. */
export function useStudent(): AuthState {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ status: "loading" });
  useEffect(() => {
    let supabase: SupabaseClient;
    try {
      supabase = getSupabaseClient();
    } catch (e) {
      setState({ status: "error", message: e instanceof SupabaseConfigError ? e.message : "Konfigurasi tidak valid." });
      return;
    }
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return router.replace("/login");
      const { data: me } = await supabase.from("users").select("role").eq("user_id", data.user.id).single();
      if (me?.role === "konselor" || me?.role === "admin") return router.replace(CAMPUS_DESTINATION);
      setState({ status: "ready", supabase, user: data.user });
    })();
  }, [router]);
  return state;
}

export function StudentNav() {
  const path = usePathname();
  const router = useRouter();
  async function logout() {
    try {
      await getSupabaseClient().auth.signOut();
    } finally {
      router.replace("/login");
    }
  }
  return (
    <header className="bg-white border-b border-brand-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <Link href="/" className="font-serif text-2xl font-semibold text-brand-900">Instride</Link>
        <nav aria-label="Navigasi mahasiswa" className="order-3 w-full sm:order-none sm:w-auto sm:flex-1 -mx-1 overflow-x-auto">
          <ul className="flex gap-1">
            {NAV.map((n) => {
              const active = path === n.href || path === `${n.href}/`;
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-3 text-sm font-medium transition-colors ${
                      active ? "bg-brand-50 text-brand-900" : "text-muted hover:text-ink hover:bg-brand-50"
                    }`}
                  >
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <button type="button" onClick={logout} className="ml-auto sm:ml-0 min-h-11 px-3 text-sm font-medium text-muted hover:text-ink">
          Keluar
        </button>
      </div>
    </header>
  );
}

export function StudentPage({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <StudentNav />
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">{title}</h1>
          {intro && <p className="mt-1 text-muted">{intro}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}

export function Loading() {
  return (
    <div aria-busy="true" aria-label="Memuat data" className="space-y-4 animate-pulse motion-reduce:animate-none">
      <div className="h-28 card" />
      <div className="h-64 card" />
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
      {message}
    </p>
  );
}

const BADGE: Record<string, string> = {
  Positif: "bg-brand-50 text-brand-900 border-brand-100",
  Netral: "bg-gray-50 text-gray-700 border-gray-200",
  Negatif: "bg-orange-50 text-negative border-orange-100",
};

export function SentimentBadge({ sentiment }: { sentiment: string | null }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${BADGE[sentiment ?? ""] ?? "bg-white text-muted border-brand-100"}`}>
      {sentiment ?? "Menunggu analisis"}
    </span>
  );
}

/** Jalankan analisis sentimen untuk jurnal yang belum dianalisis (abaikan kegagalan; tampil "Menunggu analisis"). */
export async function analyzePending(supabase: SupabaseClient) {
  try {
    await supabase.functions.invoke("analyze-sentiment", { body: {} });
  } catch {
    /* Edge Function belum ter-deploy / offline */
  }
}

/** Ambil mood + jurnal (dengan sentimen) milik user; RLS membatasi ke data sendiri. */
export async function loadHistory(supabase: SupabaseClient) {
  const [moods, journals] = await Promise.all([
    supabase.from("moods").select("mood_value, recorded_at").order("recorded_at", { ascending: false }).limit(1000),
    supabase
      .from("journals")
      .select("journal_id, content, created_at, sentiment_analysis(sentiment)")
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);
  return { moods: moods.data ?? [], journals: journals.data ?? [], error: moods.error || journals.error };
}
