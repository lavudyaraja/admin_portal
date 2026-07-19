import type { Metadata } from "next";
import PageShell, { Prose, Section } from "@/components/landing/PageShell";

export const metadata: Metadata = {
  title: "Careers — Prinsta",
  description: "Working at Prinsta.",
};

// Honest placeholder: there is no ATS behind this yet, so the page says so and
// gives one real way to get in touch rather than faking a roles list.
export default function CareersPage() {
  return (
    <PageShell
      eyebrow="Careers"
      title={
        <>
          Come build the <span className="text-rose-600">network.</span>
        </>
      }
      intro="We're small, and we hire rarely — but we always read a good email."
    >
      <Prose>
        <Section title="No open roles right now">
          <p>
            We don&apos;t have advertised positions at the moment. When we do, they&apos;ll be listed
            here.
          </p>
        </Section>

        <Section title="If you'd still like to talk">
          <p>
            Send a note to{" "}
            <a
              href="mailto:careers@prinsta.com"
              className="text-rose-600 font-semibold hover:underline underline-offset-4"
            >
              careers@prinsta.com
            </a>{" "}
            telling us what you&apos;d want to work on and something you&apos;ve built. That gets read
            properly; a generic CV usually doesn&apos;t.
          </p>
          <p>
            We&apos;re most often short of people who are good with embedded devices and printer
            hardware, and people who can make a dense console feel simple.
          </p>
        </Section>
      </Prose>
    </PageShell>
  );
}
