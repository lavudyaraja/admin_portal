import type { Metadata } from "next";
import FAQ from "@/components/landing/FAQ";

export const metadata: Metadata = {
  title: "FAQ — Prinsta",
  description: "Common questions about printing with Prinsta.",
};

export default function FAQPage() {
  return (
    <div className="pt-16">
      <FAQ />
    </div>
  );
}
