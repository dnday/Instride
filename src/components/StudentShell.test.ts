// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { loadWithBackgroundAnalysis } from "./StudentShell";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }), usePathname: () => "/" }));

function fakeSupabase(analyzed: number) {
  let releaseAnalysis!: () => void;
  const analysisDone = new Promise<void>((r) => (releaseAnalysis = r));
  const query = { select: () => query, order: () => query, limit: () => Promise.resolve({ data: [], error: null }) };
  const from = vi.fn(() => query);
  const invoke = vi.fn(async () => {
    await analysisDone; // meniru Space yang lambat "bangun tidur"
    return { data: { analyzed }, error: null };
  });
  return { client: { from, functions: { invoke } } as unknown as SupabaseClient, from, releaseAnalysis };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("loadWithBackgroundAnalysis", () => {
  it("menampilkan data tanpa menunggu analisis, lalu memuat ulang bila ada label baru", async () => {
    const { client, from, releaseAnalysis } = fakeSupabase(2);
    const onData = vi.fn();
    loadWithBackgroundAnalysis(client, onData);
    await flush();
    expect(onData).toHaveBeenCalledTimes(1); // data sudah tampil walau analisis belum selesai
    releaseAnalysis();
    await flush();
    await flush();
    expect(onData).toHaveBeenCalledTimes(2);
    expect(from).toHaveBeenCalledTimes(4); // 2 query awal + 2 query muat ulang
  });

  it("tidak memuat ulang bila tidak ada jurnal baru yang dianalisis, dan berhenti setelah unmount", async () => {
    const a = fakeSupabase(0);
    const onA = vi.fn();
    loadWithBackgroundAnalysis(a.client, onA);
    a.releaseAnalysis();
    await flush();
    await flush();
    expect(onA).toHaveBeenCalledTimes(1);

    const b = fakeSupabase(3);
    const onB = vi.fn();
    const stop = loadWithBackgroundAnalysis(b.client, onB);
    stop(); // halaman ditutup sebelum data datang
    b.releaseAnalysis();
    await flush();
    await flush();
    expect(onB).not.toHaveBeenCalled();
  });
});
