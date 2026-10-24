// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MoodForm from "./MoodForm";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

const insert = vi.fn();
const getUser = vi.fn();
vi.mock("@/lib/supabaseClient", () => ({
  getSupabaseClient: () => ({
    auth: { getUser },
    from: () => ({ insert }),
  }),
  SupabaseConfigError: class extends Error {},
}));

beforeEach(() => {
  replace.mockReset();
  insert.mockReset().mockResolvedValue({ error: null });
  getUser.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
});

describe("MoodForm", () => {
  it("renders a 1-5 accessible radiogroup", () => {
    render(<MoodForm userId="u1" alreadyToday={false} onSaved={() => {}} />);
    expect(screen.getByRole("radiogroup", { name: /pilih mood/i })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(5);
  });

  it("shows validation error and does not insert when no mood selected", async () => {
    render(<MoodForm userId="u1" alreadyToday={false} onSaved={() => {}} />);
    fireEvent.submit(screen.getByRole("button", { name: /simpan mood/i }).closest("form")!);
    expect(await screen.findByText("Mood wajib diisi")).toBeInTheDocument();
    expect(insert).not.toHaveBeenCalled();
  });

  it("inserts the selected mood and confirms on success", async () => {
    const onSaved = vi.fn();
    render(<MoodForm userId="u1" alreadyToday={false} onSaved={onSaved} />);
    fireEvent.click(screen.getByRole("radio", { name: /mood 4/i }));
    fireEvent.submit(screen.getByRole("button", { name: /simpan mood/i }).closest("form")!);
    await waitFor(() => expect(insert).toHaveBeenCalledWith({ user_id: "u1", mood_value: 4 }));
    expect(await screen.findByText(/sudah tercatat/i)).toBeInTheDocument();
    expect(onSaved).toHaveBeenCalled();
  });

  it("maps a save error to an Indonesian message and keeps selection", async () => {
    insert.mockResolvedValue({ error: { code: "42501" } });
    render(<MoodForm userId="u1" alreadyToday={false} onSaved={() => {}} />);
    fireEvent.click(screen.getByRole("radio", { name: /mood 3/i }));
    fireEvent.submit(screen.getByRole("button", { name: /simpan mood/i }).closest("form")!);
    expect(await screen.findByText(/tidak memiliki izin/i)).toBeInTheDocument();
  });

  it("redirects to /login when session is missing", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    render(<MoodForm userId="u1" alreadyToday={false} onSaved={() => {}} />);
    fireEvent.click(screen.getByRole("radio", { name: /mood 5/i }));
    fireEvent.submit(screen.getByRole("button", { name: /simpan mood/i }).closest("form")!);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(insert).not.toHaveBeenCalled();
  });
});
