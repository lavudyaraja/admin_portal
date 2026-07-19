import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { Prose, Section, Bullets } from "@/components/landing/PageShell";

export const metadata: Metadata = {
  title: "Terms & Conditions — Prinsta",
  description: "The terms you agree to when you use Prinsta.",
};

export default function TermsPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Terms & Conditions"
      intro="The rules that apply when you use Prinsta to print, or list a printer on the network."
      updated="18 July 2026"
    >
      <Prose>
        <Section title="1. Who these terms are between">
          <p>
            &ldquo;Prinsta&rdquo;, &ldquo;we&rdquo; and &ldquo;us&rdquo; mean the operator of the
            Prinsta platform. &ldquo;You&rdquo; means anyone using the app, the website, or a printer
            on the network. Using any of those means you accept these terms.
          </p>
        </Section>

        <Section title="2. Your account">
          <p>
            You need an account to print. Keep your credentials to yourself — activity under your
            account is treated as yours. Tell us promptly if you think someone else has access.
          </p>
          <p>
            You must be old enough to enter a contract in your jurisdiction, and the details you give
            us must be accurate.
          </p>
        </Section>

        <Section title="3. What you may print">
          <p>You are responsible for the content of everything you print. You may not print:</p>
          <Bullets
            items={[
              "Material you have no right to copy or reproduce.",
              "Content that is unlawful where the printer is located.",
              "Forged or fraudulent documents, including identity and financial documents.",
              "Anything a shop owner has told you they will not host on their machine.",
            ]}
          />
          <p>
            We can suspend an account that breaks this clause, and we cooperate with lawful requests
            from authorities.
          </p>
        </Section>

        <Section title="4. Payments, Points and pricing">
          <p>
            Per-page rates are set by the owner of each printer, not by us. The price you see before
            you confirm is the price you pay for that job.
          </p>
          <p>
            Points balance is credit for printing on Prinsta. It is not a deposit, earns no interest,
            and is not transferable between accounts. Points promotions such as top-up discounts can
            change or end at any time.
          </p>
        </Section>

        <Section title="5. Failed prints">
          <p>
            If a job fails — the printer is out of paper or toner, goes offline, or rejects the job —
            you are not charged, and any amount already taken is returned to your Points balance. See{" "}
            <Link
              href="/refunds"
              className="text-rose-600 font-semibold hover:underline underline-offset-4"
            >
              Refunds
            </Link>
            .
          </p>
          <p>
            We do not refund a print that came out correctly but wasn&apos;t what you meant to print.
            Use the preview before you pay.
          </p>
        </Section>

        <Section title="6. For printer owners">
          <p>
            If you list a printer, you confirm you own it or are authorised to operate it, and that
            you will keep it in working order with paper and toner available during the hours you
            advertise.
          </p>
          <p>
            You set your own rates. We deduct the platform fee shown in your console and pay the
            balance to the bank account you register. You are responsible for your own tax
            obligations on what you earn.
          </p>
        </Section>

        <Section title="7. Availability">
          <p>
            We do not guarantee that the service, or any individual printer, is available at any
            given moment. Printers are third-party machines in third-party premises and can be
            offline, busy, or out of supplies.
          </p>
        </Section>

        <Section title="8. Limits on our liability">
          <p>
            To the extent the law allows, our liability for any claim connected to a print job is
            limited to the amount you paid for that job. We are not liable for indirect or
            consequential loss — for example a deadline missed because a printer was offline.
          </p>
          <p>Nothing here limits liability that cannot lawfully be limited.</p>
        </Section>

        <Section title="9. Changes">
          <p>
            We may update these terms. Material changes will be notified in the app or by email
            before they take effect, and the date at the top of this page will change.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            Questions about these terms:{" "}
            <a
              href="mailto:support@prinsta.com"
              className="text-rose-600 font-semibold hover:underline underline-offset-4"
            >
              support@prinsta.com
            </a>
            .
          </p>
        </Section>

        <p className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 text-sm text-amber-900 leading-relaxed">
          <strong className="font-black">Note for the Prinsta team:</strong> this is a working draft
          written to match the product as built. Have it reviewed by a qualified lawyer in your
          jurisdiction before you rely on it — particularly clauses 4, 5, 6 and 8.
        </p>
      </Prose>
    </PageShell>
  );
}
