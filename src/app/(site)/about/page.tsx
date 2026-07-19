import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { Prose, Section } from "@/components/landing/PageShell";

export const metadata: Metadata = {
  title: "About Prinsta",
  description: "Why Prinsta exists and how the network works.",
};

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About us"
      title={
        <>
          Printing shouldn&apos;t need a <span className="text-rose-600">queue.</span>
        </>
      }
      intro="Prinsta turns print shops and campus centres into self-service kiosks anyone can use from their phone."
    >
      <Prose>
        <Section title="The problem">
          <p>
            Getting something printed usually means finding a shop that's open, waiting behind
            whoever got there first, handing over a pen drive, and explaining what you want. The
            printer is idle most of the day and busy in short, painful bursts.
          </p>
        </Section>

        <Section title="What we built">
          <p>
            A QR code on the machine and an app in your pocket. Scan, upload, choose your pages, pay,
            and the job goes straight to the printer's queue. Nobody has to be behind the counter for
            it to work.
          </p>
          <p>
            For shop owners that means the printer earns during the hours it used to sit idle, and
            they can watch paper, toner, revenue and payouts from one console instead of a notebook.
          </p>
        </Section>

        <Section title="How the network is run">
          <p>
            Every printer is registered by its owner and verified before it goes live. Owners set
            their own per-page rates, so pricing reflects the local market rather than a number we
            picked centrally.
          </p>
          <p>
            Documents are deleted from our servers within two minutes of printing. We hold no
            permanent copy of anything you print — that constraint shaped the architecture rather
            than being bolted on afterwards.
          </p>
        </Section>

        <Section title="Work with us">
          <p>
            If you run a print shop, listing a printer takes a few minutes and costs nothing up
            front.
          </p>
          <p>
            <Link
              href="/vendor/register?role=vendor"
              className="text-rose-600 font-bold hover:underline underline-offset-4"
            >
              Register your printer →
            </Link>
          </p>
        </Section>
      </Prose>
    </PageShell>
  );
}
