// Deteksi ungkapan risiko menyakiti diri / bunuh diri dalam jurnal, untuk menampilkan rujukan bantuan.
// Mengikuti rekomendasi WHO agar layanan kesehatan mental digital punya jalur rujukan krisis.
// Berjalan di perangkat pengguna saja: hasilnya tidak disimpan dan tidak pernah dikirim ke kampus.
// Bukan alat skrining klinis; salah deteksi hanya berakibat munculnya kartu bantuan.

const PATTERNS = [
  /bunuh\s*diri/,
  /\b(ingin|pengen|pengin|pingin|mau|rasanya|lebih\s+baik)\s+(aku\s+|saya\s+|gue\s+|gw\s+)?mati\b/,
  /\b(mengakhiri|akhiri|akhirin)\s+(hidup|semua(nya)?)\b/,
  /\b(menyakiti|melukai|nyakitin|ngelukain|nyilet|menyilet)\s+(diri|diriku|diri\s+sendiri|tangan)\b/,
  /\b(tidak|tak|gak|ga|nggak|enggak)\s+(ingin|mau|pengen|kuat)\s+hidup\b/,
  /\blebih\s+baik\s+(aku|saya|gue|gw)\s+(tidak|tak|gak|ga|nggak)\s+ada\b/,
  /\bself[\s-]?harm\b/,
  /\b(suicide|suicidal|kill\s+myself)\b/,
];

export function hasCrisisLanguage(text: string): boolean {
  const t = text.toLowerCase().replace(/\s+/g, " ");
  return PATTERNS.some((p) => p.test(t));
}

export const CRISIS_CONTACTS = [
  { name: "Layanan SEJIWA Kemenkes (konseling psikologi, 24 jam)", action: "119 ext. 8", href: "tel:119" },
  { name: "Panggilan darurat nasional", action: "112", href: "tel:112" },
];
