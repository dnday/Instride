"use client";

import { domMax, LazyMotion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Framer Motion untuk seluruh app.
 * - LazyMotion + komponen `m`: hanya fitur yang dipakai yang ikut ke bundel (domMax untuk shared layout).
 * - reducedMotion="user": bila pengguna memilih kurangi gerak, animasi transform/layout dimatikan,
 *   opacity tetap (sesuai better-ui & impeccable).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.8 }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

/** Pegas tanpa pantulan untuk perpindahan state (better-ui: bounce selalu 0). */
export const springSoft = { type: "spring", stiffness: 380, damping: 32, mass: 0.8 } as const;
/** Kedatangan elemen: kurva ease-out yang sama dengan token CSS --ease-out. */
export const enterEase = [0.16, 1, 0.3, 1] as const;
