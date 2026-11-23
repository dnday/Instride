import { MOOD_COLORS } from "@/lib/mood";

/**
 * Lapisan hangat di tepi kiri dan kanan: dua oval blur (100px) di belakang konten.
 * Dekoratif: disembunyikan dari pembaca layar dan tidak menerima klik.
 * Pemakai harus membungkus konten dengan `relative isolate overflow-hidden`.
 */
export function WarmGlow({ leftTop, rightTop }: { leftTop: string; rightTop: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <span
        className="absolute -left-40 h-80 w-[440px] rounded-full opacity-40 blur-[100px]"
        style={{ top: leftTop, background: MOOD_COLORS[2].fill }}
      />
      <span
        className="absolute -right-40 h-80 w-[440px] rounded-full opacity-40 blur-[100px]"
        style={{ top: rightTop, background: MOOD_COLORS[3].fill }}
      />
    </div>
  );
}
