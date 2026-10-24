// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import JournalForm from "./JournalForm";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

const insert = vi.fn();
const getUser = vi.fn();
vi.mock("@/lib/supabaseClient", () => ({
  getSupabaseClient: () => ({ auth: { getUser }, from: () => ({ insert }) }),
  SupabaseConfigError: class extends Error {},
}));

beforeEach(() => {
  replace.mockReset();
  insert.mockReset().mockResolvedValue({ error: null });
  getUser.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
});

describe("JournalForm", () => {
  it("shows a live character counter", () => {
    render(<JournalForm userId="u1" alreadyToday={false} onSaved={() => {}} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "halo" } });
    expect(screen.getByText("4/5000")).toBeInTheDocument();
  });

  it("rejects empty content without inserting", async () => {
    render(<JournalForm userId="u1" alreadyToday={false} onSaved={() => {}} />);
    fireEvent.submit(screen.getByRole("button", { name: /simpan jurnal/i }).closest("form")!);
    expect(await screen.findByText("Jurnal wajib diisi")).toBeInTheDocument();
    expect(insert).not.toHaveBeenCalled();
  });

  it("inserts content, clears the field, and confirms on success", async () => {
    const onSaved = vi.fn();
    render(<JournalForm userId="u1" alreadyToday={false} onSaved={onSaved} />);
    const box = screen.getByRole("textbox");
    fireEvent.change(box, { target: { value: "hari ini baik" } });
    fireEvent.submit(screen.getByRole("button", { name: /simpan jurnal/i }).closest("form")!);
    await waitFor(() => expect(insert).toHaveBeenCalledWith({ user_id: "u1", content: "hari ini baik" }));
    expect(await screen.findByText(/sudah tercatat/i)).toBeInTheDocument();
    expect((box as HTMLTextAreaElement).value).toBe("");
    expect(onSaved).toHaveBeenCalled();
  });

  it("keeps content and shows mapped error on failure", async () => {
    insert.mockResolvedValue({ error: { message: "Failed to fetch" } });
    render(<JournalForm userId="u1" alreadyToday={false} onSaved={() => {}} />);
    const box = screen.getByRole("textbox");
    fireEvent.change(box, { target: { value: "keep me" } });
    fireEvent.submit(screen.getByRole("button", { name: /simpan jurnal/i }).closest("form")!);
    expect(await screen.findByText(/tidak dapat terhubung/i)).toBeInTheDocument();
    expect((box as HTMLTextAreaElement).value).toBe("keep me");
  });
});
