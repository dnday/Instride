import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Palet tim (#4FA7A1 / #F8FAFA). Teks & tombol memakai brand-700 agar kontras >= 4.5:1 (WCAG AA);
      // brand (#4FA7A1) hanya untuk aksen dekoratif karena teks putih di atasnya hanya 2.85:1.
      colors: {
        brand: {
          50: "#E6F2F1",
          100: "#CFE9E6",
          DEFAULT: "#4FA7A1",
          700: "#2A7470",
          900: "#1F4E4B",
        },
        surface: "#F8FAFA",
        ink: "#1F2A2B",
        muted: "#56625F",
        negative: "#B4533A",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
