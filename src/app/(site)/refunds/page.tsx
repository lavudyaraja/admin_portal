import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { Prose, Section, Bullets } from "@/components/landing/PageShell";

export const metadata: Metadata = {
  title: "Refund Policy — Prinsta",
  description: "When a Prinsta print is refunded, and how long it takes.",
};

export default function RefundsPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Refund Policy"
      intro="When you get your money back, when you don't, and how long it takes."
      updated="18 July 2026"
    >
      <Prose>
        <Section title="Automatic refunds">
          <p>
            You are not charged for a print that didn&apos;t happen. If the job fails, the amount is
            returned to your Prinsta Points balance automatically — you don&apos;t need to ask.
          </p>
          <p>This covers:</p>
          <Bullets
            items={[
              "The printer was out of paper or toner.",
              "The printer went offline before the job started.",
              "The printer rejected the job.",
              "The job stayed queued past its expiry without printing.",
            ]}
          />
          <p>
            Refunds to Points normally appear within a few minutes. If an hour has passed and yours
            hasn&apos;t, raise a ticket with the order code.
          </p>
        </Section>

        <Section title="What isn't refunded">
          <p>
            A print that came out as previewed is not refundable, even if it wasn&apos;t what you
            meant to print. The preview shows the exact pages, the colour detection and the total
            before you pay — that step is your chance to check.
          </p>
          <Bullets
            items={[
              "Wrong file uploaded, or wrong pages selected.",
              "The document had a typo or formatting problem in the file itself.",
              "You changed your mind after the job had already printed.",
              "Print quality complaints caused by the machine's own condition — raise these with the shop owner, who can also refund at their discretion.",
            ]}
          />
        </Section>

        <Section title="Partial prints">
          <p>
            If a job stops part-way — paper runs out at page 8 of 20 — you are charged only for the
            pages that printed, and the rest is refunded automatically.
          </p>
        </Section>

        <Section title="Getting money out of your Points balance">
          <p>
            Points balance is credit for printing and is not normally withdrawn to a bank account.
            If you are closing your account with a balance that came from refunds rather than
            promotional credit, contact support and we will handle it case by case.
          </p>
          <p>Promotional credit — such as a top-up bonus — is not withdrawable.</p>
        </Section>

        <Section title="Disputes">
          <p>
            If you think a charge is wrong, raise a ticket within 7 days with the order code. We can
            see the job, the printer&apos;s report and the payment against it, and we&apos;ll tell you
            what we find either way.
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

        <p className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 text-sm text-amber-900 leading-relaxed">
          <strong className="font-black">Note for the Prinsta team:</strong> confirm the dispute
          window and the Points balance-withdrawal stance with whoever owns the finance side before
          publishing — those two clauses are commitments, not descriptions.
        </p>
      </Prose>
    </PageShell>
  );
}
