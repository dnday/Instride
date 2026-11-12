"use client";

import { m, useReducedMotion, useScroll, useTransform } from "framer-motion";
import dynamic from "next/dynamic";
import { type ReactNode, useRef } from "react";

// three.js hanya dimuat di landing, setelah halaman tampil
const MoodOrbs = dynamic(() => import("./MoodOrbs"), { ssr: false });

/** Lapisan yang bergeser saat halaman di-scroll. speed > 0 = lebih lambat dari scroll (terasa jauh). */
export function Parallax({ speed, children, className = "" }: { speed: number; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, speed * 220]);
  return (
    <m.div ref={ref} style={reduce ? undefined : { y }} className={className}>
      {children}
    </m.div>
  );
}

/** Latar hero: bola mood 3D, bergeser paling lambat (lapisan terjauh) dan memudar saat di-scroll. */
export function HeroBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  return (
    <m.div ref={ref} aria-hidden="true" style={reduce ? undefined : { y, opacity }} className="pointer-events-none absolute inset-0 -z-10">
      <MoodOrbs className="h-full w-full" />
      {/* Kabut tipis agar teks hero tetap kontras di atas bola */}
      <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/80 to-surface/10" />
    </m.div>
  );
}
