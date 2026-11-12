"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------------------------------
// Latihan napas pelan: tarik 4 detik, hembuskan 6 detik = 6 napas per menit.
// Dasar: napas pelan (sekitar 4-10 napas/menit) dikaitkan dengan rasa tenang dan aktivitas parasimpatis
// (tinjauan sistematis Zaccaro dkk., 2018, Frontiers in Human Neuroscience); 6 napas/menit adalah laju
// "resonansi" pada pelatihan HRV biofeedback (Lehrer & Gevirtz, 2014, Frontiers in Psychology).
// ---------------------------------------------------------------------------------------------------
const PHASES = [
  { label: "Tarik napas", secs: 4, scale: 1 },
  { label: "Hembuskan perlahan", secs: 6, scale: 0.55 },
] as const;
const ROUNDS = 6; // 6 napas x 10 detik = 1 menit

export function BreathingExercise() {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [left, setLeft] = useState<number>(PHASES[0].secs);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => {
      if (left > 1) return setLeft(left - 1);
      const next = (phase + 1) % PHASES.length;
      if (next === 0) {
        if (round + 1 >= ROUNDS) {
          setRunning(false);
          setRound(ROUNDS);
          return;
        }
        setRound(round + 1);
      }
      setPhase(next);
      setLeft(PHASES[next].secs);
    }, 1000);
    return () => clearTimeout(t);
  }, [running, left, phase, round]);

  function start() {
    setPhase(0);
    setLeft(PHASES[0].secs);
    setRound(0);
    setRunning(true);
  }

  const done = !running && round === ROUNDS;
  const current = PHASES[phase];
  const scale = running ? current.scale : 0.55;

  return (
    <section className="card flex flex-col items-center text-center" aria-labelledby="napas-title">
      <h2 id="napas-title" className="font-serif text-2xl font-semibold text-ink">Latihan napas 1 menit</h2>
      <p className="mt-1 max-w-sm text-sm text-muted">Ikuti lingkaran: tarik napas saat membesar, hembuskan saat mengecil.</p>

      <div className="relative my-8 grid h-56 w-56 place-items-center" aria-hidden="true">
        <div className="absolute inset-0 rounded-full bg-brand-50" />
        <div
          className="absolute inset-3 rounded-full bg-gradient-to-br from-[#CFE9E6] to-[#5FA67F] opacity-90 shadow-[0_20px_60px_-20px_rgba(42,116,112,0.7)] ease-in-out motion-reduce:!transition-none"
          style={{ transform: `scale(${scale})`, transition: `transform ${running ? current.secs : 0.6}s` }}
        />
        <div className="tnum relative font-serif text-4xl font-semibold text-brand-900">
          {running ? left : done ? <svg viewBox="0 0 24 24" aria-hidden="true" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg> : null}
        </div>
      </div>

      <p className="min-h-7 text-lg font-semibold text-ink" role="status" aria-live="polite">
        {running ? current.label : done ? "Selesai. Bagaimana rasanya sekarang?" : "Siap kapan pun kamu siap"}
      </p>
      <p className="mt-1 text-sm text-muted">{running ? `Napas ${round + 1} dari ${ROUNDS}` : "Tarik 4 detik · hembuskan 6 detik"}</p>

      <button type="button" className="btn mt-6" onClick={running ? () => setRunning(false) : start}>
        {running ? "Berhenti" : done ? "Ulangi" : "Mulai latihan"}
      </button>
    </section>
  );
}

// ---------------------------------------------------------------------------------------------------
// Grounding 5-4-3-2-1: teknik grounding yang umum dipakai untuk meredakan cemas dengan mengarahkan
// perhatian ke panca indra. Ditampilkan sebagai latihan mandiri, bukan terapi.
// ---------------------------------------------------------------------------------------------------
const SENSES = [
  { n: 5, verb: "lihat", hint: "Sebut 5 benda yang bisa kamu lihat di sekitarmu.", icon: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" },
  { n: 4, verb: "rasakan", hint: "Sebut 4 hal yang bisa kamu sentuh atau rasakan di kulit.", icon: "M8 13V5.5a1.5 1.5 0 0 1 3 0V12m0-1V4.5a1.5 1.5 0 0 1 3 0V12m0-6.5a1.5 1.5 0 0 1 3 0V13a7 7 0 0 1-12.4 4.4L3 14.6a1.6 1.6 0 0 1 2.4-2L8 15" },
  { n: 3, verb: "dengar", hint: "Sebut 3 suara yang bisa kamu dengar sekarang.", icon: "M3 14v-2a9 9 0 0 1 18 0v2M3 14h3v6H4a1 1 0 0 1-1-1v-5Zm18 0h-3v6h2a1 1 0 0 0 1-1v-5Z" },
  { n: 2, verb: "cium", hint: "Sebut 2 aroma yang bisa kamu cium.", icon: "M12 3c-2 3-3 6-3 9a3 3 0 0 0 6 0c0-3-1-6-3-9Zm-5 16c1.5 1.3 3.2 2 5 2s3.5-.7 5-2" },
  { n: 1, verb: "kecap", hint: "Sebut 1 rasa yang bisa kamu kecap di mulut.", icon: "M4 11h16a8 8 0 0 1-16 0Zm4-4c0-1 1-2 2-2m2 2c0-1 1-2 2-2" },
];

export function GroundingExercise() {
  const [step, setStep] = useState(0);
  const [taps, setTaps] = useState(0);
  const finished = step >= SENSES.length;
  const s = SENSES[Math.min(step, SENSES.length - 1)];

  function tap() {
    if (taps + 1 >= s.n) {
      setStep(step + 1);
      setTaps(0);
    } else setTaps(taps + 1);
  }

  return (
    <section className="card" aria-labelledby="grounding-title">
      <h2 id="grounding-title" className="font-serif text-2xl font-semibold text-ink">Grounding 5-4-3-2-1</h2>
      <p className="mt-1 text-sm text-muted">Saat pikiran berputar, kembalikan perhatian ke panca indra.</p>

      <ol className="mt-5 flex gap-2" aria-label="Langkah grounding">
        {SENSES.map((x, i) => (
          <li key={x.verb} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${i < step ? "bg-brand-700" : i === step ? "bg-brand" : "bg-brand-100"}`}>
            <span className="sr-only">{`${x.n} ${x.verb}${i < step ? " (selesai)" : ""}`}</span>
          </li>
        ))}
      </ol>

      {finished ? (
        <div className="mt-6 text-center">
          <p className="font-serif text-xl font-semibold text-ink">Kamu kembali ke saat ini.</p>
          <p className="mt-1 text-sm text-muted">Tarik napas sekali lagi, lalu lanjutkan harimu pelan-pelan.</p>
          <button type="button" className="btn-ghost mt-5" onClick={() => setStep(0)}>Ulangi</button>
        </div>
      ) : (
        <div key={step} className="page-enter mt-6">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={s.icon} />
              </svg>
            </span>
            <div>
              <p className="font-serif text-3xl font-semibold text-ink">{s.n} <span className="text-xl">hal yang kamu {s.verb}</span></p>
              <p className="text-sm text-muted">{s.hint}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3" role="group" aria-label={`Ketuk tiap kali menyebut satu hal (${taps} dari ${s.n})`}>
            {Array.from({ length: s.n }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={i === taps ? tap : undefined}
                disabled={i !== taps}
                aria-label={i < taps ? `Hal ${i + 1} sudah disebut` : `Sebut hal ${i + 1}`}
                className={`tnum grid h-12 w-12 place-items-center rounded-full border-2 text-sm font-semibold transition-colors duration-150 ${
                  i < taps
                    ? "border-brand-700 bg-brand-700 text-white"
                    : i === taps
                      ? "border-brand-700 bg-white text-brand-900 hover:bg-brand-50"
                      : "border-brand-100 bg-white text-muted"
                }`}
              >
                {i < taps ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
