// Warna per mood (inspirasi How We Feel): hangat untuk mood rendah, sejuk untuk mood tinggi.
// Dipakai konsisten di form, riwayat, kalender, dan grafik. Teks tidak pernah ditaruh di atas warna ini;
// label tetap memakai warna ink agar kontras terjaga.
export const MOOD_LABELS: Record<number, string> = {
  1: "Sangat buruk",
  2: "Buruk",
  3: "Biasa",
  4: "Baik",
  5: "Sangat baik",
};

export const MOOD_COLORS: Record<number, { fill: string; tint: string }> = {
  1: { fill: "#B4533A", tint: "#F6DED6" },
  2: { fill: "#D98A4E", tint: "#F8E6D6" },
  3: { fill: "#C7A43B", tint: "#F4EDD2" },
  4: { fill: "#5FA67F", tint: "#DDEFE4" },
  5: { fill: "#2A7470", tint: "#CFE9E6" },
};

/** Warna untuk nilai mood rata-rata (1..5, boleh pecahan). */
export const moodColor = (v: number) => MOOD_COLORS[Math.min(5, Math.max(1, Math.round(v)))];
