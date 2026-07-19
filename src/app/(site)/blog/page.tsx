import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { Prose, Section } from "@/components/landing/PageShell";

export const metadata: Metadata = {
  title: "Blog — Prinsta",
  description: "Notes from the Prinsta team.",
};

// Honest placeholder: there's no CMS behind this yet. Rather than ship invented
// posts, the page says nothing is published and points at what does exist.
export default function BlogPage() {
  return (
    <PageShell
      eyebrow="Blog"
      title={
        <>
          Notes from the <span className="text-rose-600">team.</span>
        </>
      }
      intro="Nothing published yet — we're busy building."
    >
      <Prose>
        <Section title="Coming soon">
          <p>
            We&apos;re planning to write about what we learn running printers in the field: which
            machines survive campus use, what actually causes failed jobs, and what the numbers look
            like for a shop owner.
          </p>
        </Section>

        <Section title="In the meantime">
          <p>
            <Link
              href="/#how-it-works"
              className="text-rose-600 font-semibold hover:underline underline-offset-4"
            >
              How Prinsta works
            </Link>{" "}
            walks through the whole flow, and{" "}
            <Link
              href="/about"
              className="text-rose-600 font-semibold hover:underline underline-offset-4"
            >
              About
            </Link>{" "}
            explains why we built it.
          </p>
        </Section>
      </Prose>
    </PageShell>
  );
}
