// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "./page";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock("@/components/GoogleSignInButton", () => ({ default: () => <div /> }));

const signInWithPassword = vi.fn();
const getUser = vi.fn();
const single = vi.fn();
vi.mock("@/lib/supabaseClient", () => ({
  getSupabaseClient: () => ({
    auth: { signInWithPassword, getUser },
    from: () => ({ select: () => ({ eq: () => ({ single }) }) }),
  }),
  SupabaseConfigError: class extends Error {},
}));

function submitLogin() {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@ugm.ac.id" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret12" } });
  fireEvent.submit(screen.getByRole("button", { name: /^masuk$/i }).closest("form")!);
}

beforeEach(() => {
  push.mockReset();
  signInWithPassword.mockReset().mockResolvedValue({ error: null });
  getUser.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
  single.mockReset();
});

describe("Login role-based routing", () => {
  it("routes a mahasiswa to /dashboard", async () => {
    single.mockResolvedValue({ data: { role: "mahasiswa" } });
    render(<LoginPage />);
    submitLogin();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
  });

  it("routes a konselor to /campus-dashboard", async () => {
    single.mockResolvedValue({ data: { role: "konselor" } });
    render(<LoginPage />);
    submitLogin();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/campus-dashboard"));
  });

  it("defaults to /dashboard when role lookup is null", async () => {
    single.mockResolvedValue({ data: null });
    render(<LoginPage />);
    submitLogin();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
  });
});
