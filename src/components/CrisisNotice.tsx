import Link from "next/link";

import { CRISIS_CONTACTS } from "@/lib/crisis";

/** Kartu rujukan bantuan (pedoman pesan aman: tenang, tanpa menghakimi, langsung berisi kontak). */
export function CrisisNotice() {
  return (
    <div role="alert" className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-ink">
      <p className="font-semibold">Terima kasih sudah menuliskannya. Kamu tidak harus menghadapinya sendirian.</p>
      <p className="mt-1">
        Kalau kamu sedang berpikir untuk menyakiti diri, bicarakan sekarang dengan orang yang bisa membantu. Layanan
        ini gratis dan rahasia:
      </p>
      <ul className="mt-3 space-y-2">
        {CRISIS_CONTACTS.map((c) => (
          <li key={c.action} className="flex flex-wrap items-center justify-between gap-2">
            <span>{c.name}</span>
            <a href={c.href} className="btn">Telepon {c.action}</a>
          </li>
        ))}
      </ul>
      <p className="mt-3">
        Lihat juga <Link href="/bantuan" className="font-semibold text-brand-700 underline">Sumber Daya &amp; Bantuan</Link>.
        Pesan ini hanya terlihat olehmu; kampus tidak menerima pemberitahuan apa pun.
      </p>
    </div>
  );
}
