import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrintHub Admin",
  description: "PrintHub operator & admin console",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
