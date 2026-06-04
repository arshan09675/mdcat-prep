import type { Metadata } from "next";
import { Sora, Playfair_Display } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MDCAT Prep — Your path to medical college",
  description:
    "MDCAT 2025 preparation for Pakistan: subject-wise MCQ practice with instant explanations, full-length timed mock tests, and past papers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sora.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
