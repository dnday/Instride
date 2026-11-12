import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Fraunces } from "next/font/google";
import "./globals.css";
import { MotionProvider } from "@/components/Motion";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
// Serif humanis untuk judul: memberi kesan hangat & menenangkan
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const description = "Pantau wellbeing mahasiswa dengan mood tracker, jurnal, dan analisis sentimen AI.";
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  metadataBase: new URL("https://dnday.github.io"),
  title: "Instride",
  description,
  openGraph: { title: "Instride", description, type: "website", locale: "id_ID", images: [`${base}/share.jpg`] },
  twitter: { card: "summary_large_image", title: "Instride", description, images: [`${base}/share.jpg`] },
};

export const viewport: Viewport = { themeColor: "#2A7470" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${fraunces.variable} antialiased`}
      >
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
