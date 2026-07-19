import type { Metadata } from "next";
import PageShell, { Prose, Section, Bullets } from "@/components/landing/PageShell";

export const metadata: Metadata = {
  title: "Privacy Policy — Prinsta",
  description: "What Prinsta collects, why, and how long it is kept.",
};

export default function PrivacyPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Privacy Policy"
      intro="What we collect, why we need it, and how long we keep it. The short version: your documents are deleted within two minutes of printing."
      updated="18 July 2026"
    >
      <Prose>
        <Section title="Your documents">
          <p>
            A file you upload is stored only long enough to render a preview and send the job to the
            printer. It is deleted from our servers within two minutes of the print completing, or
            of the job failing.
          </p>
          <p>
            We do not read, index, share or sell the contents of your documents, and we keep no
            permanent copy. After deletion we retain only the metadata listed below — never the file
            itself.
          </p>
        </Section>

        <Section title="What we collect">
          <Bullets
            items={[
              "Account details — name, mobile number, email address, and a hashed password. We never store your password in readable form.",
              "Order metadata — file name, page count, colour mode, cost, which printer, and timestamps. This is what your order history and any refund is based on.",
              "Payment records — the transaction reference and amount from our payment provider. Full card and UPI credentials go to the provider, not to us.",
              "Technical data — device type, app version, and error logs, used to diagnose failures.",
            ]}
          />
        </Section>

        <Section title="Why we collect it">
          <p>
            To run the service: route your job to the right printer, charge the right amount, show
            you your order history, refund failed prints, and pay shop owners what they are owed. We
            also use aggregate figures to spot printers that fail often.
          </p>
          <p>We do not use your data for advertising, and we do not sell it.</p>
        </Section>

        <Section title="Who else sees it">
          <Bullets
            items={[
              "The owner of the printer you chose sees the job metadata — file name, pages, and cost — because it prints on their machine and they are paid for it. They do not get a copy of the file.",
              "Our payment provider processes the transaction under their own privacy policy.",
              "Infrastructure providers host the service under contract, with no right to use your data for their own purposes.",
              "Authorities, where we are legally required to disclose.",
            ]}
          />
        </Section>

        <Section title="How long we keep things">
          <p>
            Documents: under two minutes after printing. Order and payment records: as long as tax
            and accounting law requires, because they are financial records. Account details: until
            you delete your account.
          </p>
        </Section>

        <Section title="Your choices">
          <p>
            You can view and correct your account details in the app, download your order history,
            and delete your account. Deleting your account removes your personal details; financial
            records we are legally obliged to keep are retained in anonymised form.
          </p>
          <p>
            You can turn off email and push notifications without affecting your ability to print.
          </p>
        </Section>

        <Section title="Security">
          <p>
            Uploads travel over SSL/TLS. Passwords are hashed with bcrypt. Access to production data
            is restricted to staff who need it, and we review that access regularly.
          </p>
          <p>
            No system is perfectly secure. If a breach ever affects your data, we will tell you and
            the relevant authority as required by law.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Privacy questions or requests:{" "}
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
          <strong className="font-black">Note for the Prinsta team:</strong> this describes the
          product as built. Before publishing, confirm the retention periods against what the backend
          actually does, name your real payment and hosting providers, and have it checked against
          India&apos;s DPDP Act (and GDPR if you take EU users).
        </p>
      </Prose>
    </PageShell>
  );
}
