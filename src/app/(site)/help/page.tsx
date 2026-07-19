import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { Prose, Section, Bullets } from "@/components/landing/PageShell";

export const metadata: Metadata = {
  title: "Help Center — Prinsta",
  description: "Fixes for the things that most often go wrong with a print.",
};

export default function HelpPage() {
  return (
    <PageShell
      eyebrow="Help Center"
      title={
        <>
          Something not <span className="text-rose-600">working?</span>
        </>
      }
      intro="The problems we see most, and what to do about each one."
    >
      <Prose>
        <Section title="The printer didn't print after I paid">
          <p>
            The job sits in the queue until the printer reports back, so a busy machine can take a
            minute. If nothing comes out after that, open the order from your Orders tab and check
            its status.
          </p>
          <Bullets
            items={[
              "Queued — the printer hasn't picked the job up yet. Wait, or pick another printer nearby.",
              "Failed — the job was rejected, usually out of paper or toner. You are not charged for a failed print.",
              "Completed — the job printed. If the paper isn't in the tray, ask the shop owner.",
            ]}
          />
        </Section>

        <Section title="I was charged but the print failed">
          <p>
            Failed prints are refunded to your Points balance automatically. It normally lands within a few
            minutes. If it hasn't after an hour, raise a ticket with the order code and we'll trace
            it.
          </p>
        </Section>

        <Section title="The QR code won't scan">
          <p>
            Clean the sticker and make sure there's enough light on it. If the code is torn or faded,
            tell the shop owner — they can print a fresh one from their console in a few seconds.
          </p>
        </Section>

        <Section title="My PDF looks wrong in the preview">
          <p>
            Prinsta renders the file exactly as the printer will. If the preview is wrong, the file
            is usually the problem: password-protected PDFs, unusual embedded fonts, and files still
            syncing from cloud storage are the common causes. Re-export the document and upload it
            again.
          </p>
        </Section>

        <Section title="Colour pages are costing more than I expected">
          <p>
            Prinsta scans each page and charges colour rates only on pages that actually contain
            colour. A single coloured logo or heading makes a page a colour page. The preview shows
            which pages were detected as colour before you pay — check it there if the total looks
            high.
          </p>
        </Section>

        <Section title="Still stuck?">
          <p>
            Raise a ticket and include the order code. We can see the job, the printer, and the
            payment against it, which is much faster than describing it.
          </p>
          <p>
            <Link
              href="/contact"
              className="text-rose-600 font-bold hover:underline underline-offset-4"
            >
              Contact support →
            </Link>
          </p>
        </Section>
      </Prose>
    </PageShell>
  );
}
