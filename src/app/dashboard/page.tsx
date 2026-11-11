"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getSupabaseClient, SupabaseConfigError } from "@/lib/supabaseClient";
import DailyEntryForm from "./DailyEntryForm";

const PRIMARY = "#4FA7A1";

type State =
  | { status: "loading" }
  | { status: "configError"; message: string }
  | { status: "ready"; alreadyToday: boolean; warning?: string };

function todayRange(now: Date = new Date()): { startIso: string; endIso: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export default function DashboardPage() {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let supabase: ReturnType<typeof getSupabaseClient>;
    try {
      supabase = getSupabaseClient();
    } catch (e) {
      if (e instanceof SupabaseConfigError) {
        return setState({ status: "configError", message: e.message });
      }
      return setState({ status: "configError", message: "Konfigurasi tidak valid." });
    }

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace("/login");
        return;
      }
      // Konselor/admin salah halaman: arahkan ke campus dashboard.
      const { data: me } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", auth.user.id)
        .single();
      if (me?.role === "konselor" || me?.role === "admin") {
        router.replace("/campus-dashboard");
        return;
      }
      const { startIso, endIso } = todayRange();
      const [moodRes, journalRes] = await Promise.all([
        supabase.from("moods").select("mood_id").gte("recorded_at", startIso).lt("recorded_at", endIso).limit(1),
        supabase.from("journals").select("journal_id").gte("created_at", startIso).lt("created_at", endIso).limit(1),
      ]);
      setState({
        status: "ready",
        // Jurnal lama bisa tersimpan tanpa mood, jadi keduanya tetap dicek
        alreadyToday: (moodRes.data?.length ?? 0) > 0 || (journalRes.data?.length ?? 0) > 0,
        // Jangan diam-diam menganggap belum ada entri kalau pengecekan gagal
        warning:
          moodRes.error || journalRes.error
            ? "Status catatan hari ini gagal dimuat. Periksa koneksi sebelum menyimpan lagi."
            : undefined,
      });
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8FAFA] text-gray-900">
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 text-white" style={{ background: PRIMARY }}>
        <h1 className="font-semibold">Instride</h1>
      </header>

      <main className="max-w-2xl mx-auto p-4 sm:p-8 space-y-6">
        <h2 className="text-2xl font-semibold">Catatan Harian</h2>

        {state.status === "loading" && <p>Memuat...</p>}
        {state.status === "configError" && (
          <p className="text-red-600" role="alert">{state.message}</p>
        )}
        {state.status === "ready" && (
          <>
            {state.warning && (
              <p className="rounded bg-yellow-50 p-3 text-sm text-yellow-800" role="status">
                {state.warning}
              </p>
            )}
            <DailyEntryForm alreadyToday={state.alreadyToday} />
          </>
        )}
      </main>
    </div>
  );
}
