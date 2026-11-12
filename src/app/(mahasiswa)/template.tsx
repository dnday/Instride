"use client";

import { m } from "framer-motion";
import type { ReactNode } from "react";

import { enterEase } from "@/components/Motion";

// template.tsx dipasang ulang setiap pindah halaman: isi halaman masuk halus, navigasi (di layout) tetap diam.
// Dengan reduce motion, MotionConfig mematikan geseran dan hanya menyisakan opacity.
export default function StudentTemplate({ children }: { children: ReactNode }) {
  return (
    <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: enterEase }}>
      {children}
    </m.div>
  );
}
