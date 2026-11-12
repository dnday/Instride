// Satu set ikon garis (stroke 1.8, currentColor) agar semua ikon satu gaya (better-ui: satu library per permukaan).
const PATHS = {
  flame: "M12 22c4 0 7-2.7 7-6.8 0-3.4-2.2-5.7-4-7.7-.5 1.7-1.6 3-3 3.5.3-2.8-.6-5.6-3-8C9 6 5 9.6 5 15.2 5 19.3 8 22 12 22Zm0 0c-1.7 0-3-1.2-3-3 0-1.6 1.2-2.7 3-4.5 1.8 1.8 3 2.9 3 4.5 0 1.8-1.3 3-3 3Z",
  calendar: "M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 8h2m4 0h2m-8 4h2",
  pen: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z",
  sun: "M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7 1.4-1.4M4.9 19.1l1.4-1.4m0-11.4L4.9 4.9m14.2 14.2-1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  trendUp: "M3 17l6-6 4 4 8-8m0 0h-6m6 0v6",
  trendDown: "M3 7l6 6 4-4 8 8m0 0h-6m6 0v-6",
  chart: "M4 19V5m0 14h16M8 15l3-4 3 2 4-6",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Zm0 0A2.5 2.5 0 0 0 6.5 22H20v-5",
  sparkle: "M12 3l1.8 4.9L19 10l-5.2 2.1L12 17l-1.8-4.9L5 10l5.2-2.1L12 3Zm7 13 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Judul kartu dengan ikon bertint. */
export function CardTitle({ icon, id, children }: { icon: IconName; id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="flex items-center gap-2.5 font-semibold text-ink">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>
      {children}
    </h2>
  );
}
