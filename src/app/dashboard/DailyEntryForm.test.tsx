// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DailyEntryForm from "./DailyEntryForm";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

const rpc = vi.fn();
const getUser = vi.fn();
vi.mock("@/lib/supabaseClient", () => ({
  getSupabaseClient: () => ({ auth: { getUser }, rpc }),
  SupabaseConfigError: class extends Error {},
}));

const submit = () =>
  fireEvent.submit(screen.getByRole("button", { name: /simpan catatan/i }).closest("form")!);
const pickMood = (v: number) => fireEvent.click(screen.getByRole("radio", { name: new RegExp(`mood ${v}`, "i") }));
const typeJournal = (text: string) =>
  fireEvent.change(screen.getByLabelText(/jurnal/i), { target: { value: text } });

beforeEach(() => {
  replace.mockReset();
  rpc.mockReset().mockResolvedValue({ data: { mood_id: 1, journal_id: 1 }, error: null });
  getUser.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
});

describe("DailyEntryForm", () => {
  it("menampilkan pilihan mood 1-5 dan textarea jurnal opsional", () => {
    render(<DailyEntryForm alreadyToday={false} />);
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    expect(screen.getByLabelText(/jurnal/i)).toBeInTheDocument();
    expect(screen.getByText("0/5000")).toBeInTheDocument();
  });

  it("menolak tanpa mood dan tidak memanggil Supabase", async () => {
    render(<DailyEntryForm alreadyToday={false} />);
    typeJournal("isi jurnal");
    submit();
    expect(await screen.findByText("Mood wajib diisi")).toBeInTheDocument();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("menampilkan error mood dan jurnal sekaligus", async () => {
    render(<DailyEntryForm alreadyToday={false} />);
    typeJournal("a".repeat(5001));
    submit();
    expect(await screen.findByText("Mood wajib diisi")).toBeInTheDocument();
    expect(screen.getByText("Jurnal maksimal 5000 karakter")).toBeInTheDocument();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("menyimpan mood + jurnal lewat satu RPC lalu mengosongkan form", async () => {
    const onSaved = vi.fn();
    render(<DailyEntryForm alreadyToday={false} onSaved={onSaved} />);
    pickMood(4);
    typeJournal("hari ini baik");
    submit();
    await waitFor(() =>
      expect(rpc).toHaveBeenCalledWith("save_daily_entry", { p_mood: 4, p_content: "hari ini baik" }),
    );
    expect(await screen.findByText("Catatan harian tersimpan.")).toBeInTheDocument();
    expect(screen.getByLabelText(/jurnal/i)).toHaveValue("");
    expect(onSaved).toHaveBeenCalled();
  });

  it("jurnal kosong/spasi dikirim sebagai null (hanya mood)", async () => {
    render(<DailyEntryForm alreadyToday={false} />);
    pickMood(3);
    typeJournal("   ");
    submit();
    await waitFor(() => expect(rpc).toHaveBeenCalledWith("save_daily_entry", { p_mood: 3, p_content: null }));
  });

  it("error penyimpanan ditampilkan dalam bahasa Indonesia dan isian dipertahankan", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "permission denied" } });
    render(<DailyEntryForm alreadyToday={false} />);
    pickMood(2);
    typeJournal("tetap ada");
    submit();
    expect(await screen.findByText(/tidak memiliki izin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/jurnal/i)).toHaveValue("tetap ada");
  });

  it("sesi berakhir saat menyimpan -> diarahkan ke /login", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "PGRST301", message: "JWT expired" } });
    render(<DailyEntryForm alreadyToday={false} />);
    pickMood(5);
    submit();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("tanpa sesi -> diarahkan ke /login tanpa memanggil RPC", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    render(<DailyEntryForm alreadyToday={false} />);
    pickMood(5);
    submit();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(rpc).not.toHaveBeenCalled();
  });

  it("memberi tahu bila sudah mencatat hari ini, tapi tetap bisa menambah", () => {
    render(<DailyEntryForm alreadyToday />);
    expect(screen.getByText(/sudah mencatat hari ini/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /simpan catatan/i })).toBeEnabled();
  });
});
