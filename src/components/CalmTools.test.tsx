// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BreathingExercise, GroundingExercise } from "./CalmTools";

afterEach(() => vi.useRealTimers());
// Komponen menjadwalkan ulang timer tiap detik setelah render, jadi waktu dimajukan per detik
const tick = (secs: number) => {
  for (let i = 0; i < secs; i++) act(() => vi.advanceTimersByTime(1000));
};

describe("BreathingExercise", () => {
  it("berganti fase tarik 4 detik lalu hembus 6 detik, selesai setelah 6 napas", () => {
    vi.useFakeTimers();
    render(<BreathingExercise />);
    fireEvent.click(screen.getByRole("button", { name: /mulai latihan/i }));
    expect(screen.getByRole("status")).toHaveTextContent("Tarik napas");
    tick(4);
    expect(screen.getByRole("status")).toHaveTextContent("Hembuskan perlahan");
    tick(6);
    expect(screen.getByText("Napas 2 dari 6")).toBeInTheDocument();
    tick(50); // sisa 5 napas x 10 detik
    expect(screen.getByRole("status")).toHaveTextContent(/selesai/i);
    expect(screen.getByRole("button", { name: /ulangi/i })).toBeInTheDocument();
  });
});

describe("GroundingExercise", () => {
  it("maju dari 5 lihat sampai 1 kecap dengan mengetuk tiap hal", () => {
    render(<GroundingExercise />);
    for (const n of [5, 4, 3, 2, 1]) {
      expect(screen.getByText(String(n), { selector: "p.font-serif" })).toBeInTheDocument();
      for (let i = 1; i <= n; i++) fireEvent.click(screen.getByRole("button", { name: `Sebut hal ${i}` }));
    }
    expect(screen.getByText(/kembali ke saat ini/i)).toBeInTheDocument();
  });
});
