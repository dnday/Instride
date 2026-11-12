import { MOOD_COLORS } from "@/lib/mood";

/**
 * Wajah mood (gaya desain Stitch "Catatan Harian"): lingkaran ber-tint warna mood dengan wajah bergaris
 * warna mood. Mood 1 bermata silang, 5 bermata senyum; lengkung mulut dari sedih ke senang.
 * `active` dipertahankan untuk kompatibilitas; seleksi digambar oleh pembungkus (cincin + centang).
 */
export function MoodFace({ value, className = "h-10 w-10" }: { value: number; active?: boolean; className?: string }) {
  const v = Math.min(5, Math.max(1, Math.round(value)));
  const curve = (v - 3) * 2.4;
  const { fill, tint } = MOOD_COLORS[v];
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="16" fill={tint} />
      <g fill="none" stroke={fill} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="16" r="9.5" />
        {v === 1 ? (
          <path d="M11.6 12.4l2 2m0-2l-2 2M18.4 12.4l2 2m0-2l-2 2" />
        ) : v === 5 ? (
          <path d="M11.4 14.2q1.2-1.6 2.4 0M18.2 14.2q1.2-1.6 2.4 0" />
        ) : (
          <path d="M12.6 13.4h.01M19.4 13.4h.01" strokeWidth="2.6" />
        )}
        {v === 3 ? (
          <path d="M12.8 19.4h6.4" />
        ) : (
          <path d={`M12.2 ${19.6 - curve / 3} Q16 ${19.6 + curve} 19.8 ${19.6 - curve / 3}`} />
        )}
      </g>
    </svg>
  );
}
