import { MOOD_COLORS } from "@/lib/mood";

/** Wajah mood: lengkung mulut dari sedih (1) ke senang (5), diwarnai sesuai mood. */
export function MoodFace({ value, active = true, className = "h-10 w-10" }: { value: number; active?: boolean; className?: string }) {
  const v = Math.min(5, Math.max(1, Math.round(value)));
  const curve = (v - 3) * 2.2;
  const { fill, tint } = MOOD_COLORS[v];
  const ink = active ? "#1F2A2B" : "#56625F";
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="14" fill={active ? tint : "#F8FAFA"} stroke={active ? fill : "#9AA5A2"} strokeWidth={active ? 2.2 : 1.6} />
      <circle cx="11.5" cy="13" r="1.6" fill={ink} />
      <circle cx="20.5" cy="13" r="1.6" fill={ink} />
      <path d={`M10 ${20 - curve / 2} Q16 ${20 + curve} 22 ${20 - curve / 2}`} fill="none" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
