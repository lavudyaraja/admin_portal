import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/*
 * Inter, at the weights the page actually uses — 400/500 for body, 600/700 for
 * headings, 800/900 for the display headlines and the `font-black` nav.
 *
 * The `*-family` variable names are the ones globals.css reads, and the split
 * matters: `@theme inline` owns `--font-sans` (family + fallback stack), so the
 * loaded face has to arrive under a different name or the two would reference
 * each other. That is exactly what used to be wrong — the font was published as
 * `--font-geist-sans` while the theme declared `--font-sans: var(--font-sans)`,
 * a self-reference resolving to nothing, so the whole site rendered in the
 * browser's default face and none of the loaded font was ever used.
 */
const sans = Inter({
  variable: "--font-sans-family",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-family",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Prinsta — Smart Self-Service Printing Platform",
  description:
    "Prinsta turns campus shops and print centres into self-service kiosks: scan a QR, upload, pay by UPI or Points, and print wirelessly in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
