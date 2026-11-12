"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

import { CAMPUS_DESTINATION } from "@/lib/constants";
import { getSupabaseClient, SupabaseConfigError } from "@/lib/supabaseClient";

const NAV = [
  { href: "/dashboard", label: "Catatan", short: "Catatan", icon: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" },
  { href: "/ringkasan", label: "Dashboard Saya", short: "Tren", icon: "M4 19V5m0 14h16M8 15l3-4 3 2 4-6" },
  { href: "/riwayat", label: "Riwayat", short: "Riwayat", icon: "M12 8v4l3 2M3.05 11a9 9 0 1 1 .5 4M3 4v5h5" },
  { href: "/bantuan", label: "Bantuan", short: "Bantuan", icon: "M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z" },
  { href: "/profil", label: "Profil", short: "Profil", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0" },
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
  const isActive = (href: string) => path === href || path === `${href}/`;
  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-brand-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-16 flex items-center gap-6">
          <Link href="/" className="inline-flex min-h-11 items-center font-serif text-2xl font-semibold text-brand-900">Instride</Link>
          <nav aria-label="Navigasi mahasiswa" className="hidden sm:block flex-1">
            <ul className="flex gap-1">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={isActive(n.href) ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-3 text-sm font-medium transition-colors ${
                      isActive(n.href) ? "bg-brand-50 text-brand-900" : "text-ink hover:bg-brand-50"
                    }`}
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <button type="button" onClick={logout} className="ml-auto sm:ml-0 min-h-11 px-3 text-sm font-medium text-ink hover:text-brand-700">
            Keluar
          </button>
        </div>
      </header>

      {/* Ponsel: tab bawah seperti aplikasi, mudah dijangkau jempol */}
      <nav aria-label="Navigasi mahasiswa (ponsel)" className="sm:hidden fixed inset-x-0 bottom-0 z-30 border-t border-brand-100 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <ul className="grid grid-cols-5">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                  isActive(n.href) ? "text-brand-700" : "text-muted"
                }`}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor"
                  strokeWidth={isActive(n.href) ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d={n.icon} />
                </svg>
                {n.short}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

export function StudentPage({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <StudentNav />
      <main className="max-w-5xl mx-auto px-4 sm:px-8 pt-8 pb-24 sm:pb-12 space-y-6">
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
