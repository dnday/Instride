import { hasCrisisLanguage } from "./crisis";

describe("hasCrisisLanguage", () => {
  it.each([
    "Aku pengen mati aja rasanya",
    "kadang kepikiran bunuh diri",
    "rasanya ingin mengakhiri hidup",
    "tadi aku menyakiti diri sendiri lagi",
    "gak kuat hidup kayak gini terus",
    "lebih baik aku tidak ada",
    "I feel suicidal",
  ])("mendeteksi: %s", (t) => expect(hasCrisisLanguage(t)).toBe(true));

  it.each([
    "hari ini capek banget sama tugas",
    "baterai hp mati pas presentasi",
    "aku mau hidup sehat mulai besok",
    "deadline mematikan tapi akhirnya selesai",
  ])("tidak salah deteksi: %s", (t) => expect(hasCrisisLanguage(t)).toBe(false));
});
