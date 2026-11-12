"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Dikte suara memakai Web Speech API bawaan browser (Chrome, Edge, Safari). Tanpa library & tanpa biaya.
// Catatan privasi: di Chrome, audio diproses server pengenalan suara Google (disebut di /privasi).

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

const getCtor = (): (new () => Recognition) | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

const ERRORS: Record<string, string> = {
  "not-allowed": "Izin mikrofon ditolak. Izinkan mikrofon di pengaturan browser untuk memakai dikte.",
  "service-not-allowed": "Izin mikrofon ditolak. Izinkan mikrofon di pengaturan browser untuk memakai dikte.",
  "no-speech": "Tidak ada suara yang terdengar. Coba lagi lebih dekat ke mikrofon.",
  "audio-capture": "Mikrofon tidak ditemukan.",
  network: "Dikte butuh koneksi internet.",
};

/** Menambahkan setiap kalimat final ke teks lewat `onText`; `interim` berisi kata yang sedang didengar. */
export function useDictation(onText: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useEffect(() => setSupported(getCtor() !== null), []);
  useEffect(() => () => rec.current?.stop(), []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "id-ID";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) onTextRef.current(res[0].transcript.trim());
        else live += res[0].transcript;
      }
      setInterim(live);
    };
    r.onerror = (e) => {
      if (e.error !== "aborted") setError(ERRORS[e.error] ?? "Dikte berhenti karena kesalahan. Coba lagi.");
    };
    r.onend = () => {
      setListening(false);
      setInterim("");
    };
    rec.current = r;
    setError(null);
    setListening(true);
    r.start();
  }, []);

  const stop = useCallback(() => rec.current?.stop(), []);

  return { supported, listening, interim, error, start, stop, toggle: () => (listening ? stop() : start()) };
}

/** Gabungkan teks dikte ke isi jurnal dengan spasi/titik yang wajar. */
export function appendDictation(current: string, spoken: string): string {
  if (!spoken) return current;
  const sentence = spoken.charAt(0).toUpperCase() + spoken.slice(1);
  const base = current.trimEnd();
  if (!base) return sentence;
  return /[.!?]$/.test(base) ? `${base} ${sentence}` : `${base}. ${sentence}`;
}
