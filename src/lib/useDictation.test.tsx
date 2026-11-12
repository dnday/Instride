// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import DailyEntryForm from "@/app/dashboard/DailyEntryForm";
import { appendDictation } from "./useDictation";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));
vi.mock("@/lib/supabaseClient", () => ({ getSupabaseClient: vi.fn(), SupabaseConfigError: class extends Error {} }));

type Handler = ((e: unknown) => void) | null;
class FakeRecognition {
  static last: FakeRecognition | null = null;
  lang = "";
  continuous = false;
  interimResults = false;
  onresult: Handler = null;
  onerror: Handler = null;
  onend: (() => void) | null = null;
  start = vi.fn(() => (FakeRecognition.last = this));
  stop = vi.fn(() => this.onend?.());
}

const speak = (transcript: string, isFinal: boolean) =>
  act(() => FakeRecognition.last!.onresult?.({ resultIndex: 0, results: [{ isFinal, 0: { transcript } }] }));

afterEach(() => {
  delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  FakeRecognition.last = null;
});

describe("appendDictation", () => {
  it("menambah kalimat dengan huruf kapital dan titik pemisah", () => {
    expect(appendDictation("", "hari ini capek")).toBe("Hari ini capek");
    expect(appendDictation("Pagi tadi kuliah", "sore main futsal")).toBe("Pagi tadi kuliah. Sore main futsal");
    expect(appendDictation("Sudah selesai!", "lega")).toBe("Sudah selesai! Lega");
    expect(appendDictation("Tetap", "")).toBe("Tetap");
  });
});

describe("Dikte suara di form catatan", () => {
  it("tombol tidak tampil bila browser tidak mendukung", () => {
    render(<DailyEntryForm alreadyToday={false} />);
    expect(screen.queryByRole("button", { name: /dikte suara/i })).toBeNull();
  });

  it("memakai bahasa Indonesia dan memasukkan ucapan final ke jurnal", () => {
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition = FakeRecognition;
    render(<DailyEntryForm alreadyToday={false} />);
    fireEvent.click(screen.getByRole("button", { name: /dikte suara/i }));
    expect(FakeRecognition.last!.lang).toBe("id-ID");
    expect(screen.getByRole("button", { name: /berhenti/i })).toHaveAttribute("aria-pressed", "true");

    speak("hari ini aku", false);
    expect(screen.getByText("hari ini aku")).toBeInTheDocument();
    speak("hari ini aku senang", true);
    expect(screen.getByLabelText(/jurnal/i)).toHaveValue("Hari ini aku senang");

    fireEvent.click(screen.getByRole("button", { name: /berhenti/i }));
    expect(screen.getByRole("button", { name: /dikte suara/i })).toHaveAttribute("aria-pressed", "false");
  });
});
