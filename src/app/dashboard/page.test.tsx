// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "./page";

const replace = vi.fn();
const push = vi.fn();
const router = { replace, push };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

vi.mock("./MoodForm", () => ({ default: () => <div data-testid="mood-form" /> }));
vi.mock("./JournalForm", () => ({ default: () => <div data-testid="journal-form" /> }));

const h = vi.hoisted(() => {
  class FakeConfigError extends Error {}
  return {
    FakeConfigError,
    getUser: vi.fn(),
    limit: vi.fn(),
    single: vi.fn(),
    state: { configThrows: false },
  };
});

vi.mock("@/lib/supabaseClient", () => ({
  getSupabaseClient: () => {
    if (h.state.configThrows) throw new h.FakeConfigError("Konfigurasi Supabase tidak lengkap");
    return {
      auth: { getUser: h.getUser },
      from: (table: string) =>
        table === "users"
          ? { select: () => ({ eq: () => ({ single: h.single }) }) }
          : { select: () => ({ gte: () => ({ lt: () => ({ limit: h.limit }) }) }) },
    };
  },
  SupabaseConfigError: h.FakeConfigError,
}));

beforeEach(() => {
  replace.mockReset();
  h.state.configThrows = false;
  h.getUser.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
  h.limit.mockReset().mockResolvedValue({ data: [] });
  h.single.mockReset().mockResolvedValue({ data: { role: "mahasiswa" } });
});

describe("DashboardPage session gate", () => {
  it("renders both forms when a session exists", async () => {
    render(<DashboardPage />);
    expect(await screen.findByTestId("mood-form")).toBeInTheDocument();
    expect(screen.getByTestId("journal-form")).toBeInTheDocument();
  });

  it("redirects to /login when there is no session", async () => {
    h.getUser.mockResolvedValue({ data: { user: null } });
    render(<DashboardPage />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("shows a config error without a network request", async () => {
    h.state.configThrows = true;
    render(<DashboardPage />);
    expect(await screen.findByText(/konfigurasi supabase tidak lengkap/i)).toBeInTheDocument();
    expect(h.getUser).not.toHaveBeenCalled();
  });

  it("redirects a konselor to /campus-dashboard", async () => {
    h.single.mockResolvedValue({ data: { role: "konselor" } });
    render(<DashboardPage />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/campus-dashboard"));
  });
});
