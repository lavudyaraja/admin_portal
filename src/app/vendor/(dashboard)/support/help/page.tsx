"use client";

// Help Center.
//
// Static, on purpose. Every answer here is about how this console actually
// behaves — the refund flow, what verification gates, why a payout can fail —
// so it lives next to the code that decides those things rather than in a CMS
// that would drift away from them.
import { useState } from "react";
import {
  LuBookOpen, LuChevronDown, LuPrinter, LuUndo2, LuWallet, LuStar, LuBadgeCheck, LuMail,
} from "react-icons/lu";
import Link from "next/link";
import { Card, PageHeader, cx } from "@/components/console/primitives";

interface Article {
  q: string;
  a: React.ReactNode;
}

interface Section {
  title: string;
  icon: typeof LuPrinter;
  articles: Article[];
}

const SECTIONS: Section[] = [
  {
    title: "Printers",
    icon: LuPrinter,
    articles: [
      {
        q: "My printer shows Offline but it's switched on",
        a: (
          <>
            Status comes from the printer checking in. If it stops — network drop, sleep mode, cable
            out — the last known status sticks and the machine goes stale.{" "}
            <Link href="/vendor/printers/status" className="font-semibold hover:underline">
              Printer Status
            </Link>{" "}
            shows when each machine was last heard from; anything over 24 hours is flagged. Check the
            network first, then power-cycle.
          </>
        ),
      },
      {
        q: "Why is a printer marked as needing attention?",
        a: (
          <>
            <Link href="/vendor/printers/maintenance" className="font-semibold hover:underline">
              Maintenance
            </Link>{" "}
            lists every reason, and a machine can have several at once. Low paper and toner are
            obvious; the one worth watching is the failure rate — a printer that fails a fifth of its
            jobs gets flagged even while it reports itself as fine.
          </>
        ),
      },
      {
        q: "How do customers find my printer?",
        a: (
          <>
            They scan the QR code on the machine, or pick it from the nearby list in the app. Print
            fresh codes from{" "}
            <Link href="/vendor/qr" className="font-semibold hover:underline">
              QR Codes
            </Link>
            . Each code resolves to one machine at one branch, so keep them on the right printers.
          </>
        ),
      },
    ],
  },
  {
    title: "Refunds",
    icon: LuUndo2,
    articles: [
      {
        q: "A customer asked for a refund — what happens?",
        a: (
          <>
            It lands in{" "}
            <Link
              href="/vendor/finance/refund-requests"
              className="font-semibold hover:underline"
            >
              Refund Requests
            </Link>
            . You decide first, because you&apos;re the one who saw the machine. Approving credits
            the customer&apos;s points immediately and can&apos;t be undone from the console.
          </>
        ),
      },
      {
        q: "Do I have to give a reason when I turn one down?",
        a: "Yes — it's required. A rejection with no explanation is the single biggest cause of a customer escalating to platform support, which takes the decision out of your hands entirely.",
      },
      {
        q: "What happens if a customer escalates?",
        a: "Platform support reviews the order, your decision, and what the customer said. They can uphold your call or overrule it and refund. Either way you don't need to do anything — the request leaves your queue.",
      },
      {
        q: "A print failed. Do I need to refund it?",
        a: "Usually not. A print that fails outright is refunded automatically the moment the order lands in FAILED, before the customer can even ask. Requests reach you for the cases automation can't see — smudged pages, half-finished jobs, a machine that ate the paper.",
      },
    ],
  },
  {
    title: "Money",
    icon: LuWallet,
    articles: [
      {
        q: "When do I get paid?",
        a: (
          <>
            Platform staff draw up a payout covering a period of your completed orders and transfer
            it. Nothing here moves money on its own, which is why a payout can sit at Pending and why
            it can fail.{" "}
            <Link href="/vendor/finance/payouts" className="font-semibold hover:underline">
              Payouts
            </Link>{" "}
            shows every one, with its bank reference once it&apos;s been made.
          </>
        ),
      },
      {
        q: "Revenue and Earnings show different numbers",
        a: "Revenue is what customers paid. Earnings is that less refunds and commission, split into what's already been paid out and what's still owed. If you're asking how much you're owed, that's Outstanding on the Earnings page.",
      },
      {
        q: "My payout failed",
        a: (
          <>
            Almost always stale bank details. Check{" "}
            <Link href="/vendor/bank-account" className="font-semibold hover:underline">
              Bank Accounts
            </Link>{" "}
            — the failure reason on the payout usually names the problem. Fix it and the next payout
            picks up the same amount.
          </>
        ),
      },
    ],
  },
  {
    title: "Ratings",
    icon: LuStar,
    articles: [
      {
        q: "Can I get a bad review removed?",
        a: "Not directly. Platform staff can hide a rating that breaks the rules — abuse, or something aimed at a person rather than the service — and a hidden rating drops out of your average. A review that's simply negative stays up. Contact support with the order code if you think one crosses the line.",
      },
      {
        q: "Should I rate customers?",
        a: (
          <>
            It helps other shops. A customer who never collects, or who jams a machine and walks off,
            leaves a trace the next shop can see before they take the order.{" "}
            <Link href="/vendor/ratings" className="font-semibold hover:underline">
              Ratings
            </Link>{" "}
            lists the customers you can still rate.
          </>
        ),
      },
      {
        q: "Why can't I change a rating I left?",
        a: "Ratings are final once submitted, in both directions. That's what stops them being renegotiated after the fact — a customer shouldn't be able to talk a shop into revising a rating, and vice versa.",
      },
    ],
  },
  {
    title: "Verification",
    icon: LuBadgeCheck,
    articles: [
      {
        q: "My shop is awaiting verification",
        a: "Platform staff check every shop before it goes live. Until then your printers won't appear to customers. You can't verify yourself — it's deliberately not a self-service step.",
      },
      {
        q: "My verification was declined",
        a: (
          <>
            The reason shows on{" "}
            <Link href="/vendor/shop" className="font-semibold hover:underline">
              Shop Profile
            </Link>
            . Fix what it names, then contact support to ask for another look.
          </>
        ),
      },
    ],
  },
];

function Accordion({ article }: { article: Article }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <span className="flex-1 text-sm font-semibold text-slate-800">{article.q}</span>
        <LuChevronDown
          size={16}
          className={cx("text-slate-400 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 -mt-1">
          <p className="text-sm text-slate-600 leading-relaxed">{article.a}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpCenterPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <PageHeader
        title="Help Center"
        subtitle="How this console actually behaves, answered by the people who built it."
      />

      {SECTIONS.map((section) => {
        const Icon = section.icon;
        return (
          <Card key={section.title}>
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
              <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                <Icon size={15} />
              </span>
              <h2 className="text-sm font-bold text-slate-800">{section.title}</h2>
            </div>
            <div>
              {section.articles.map((a) => (
                <Accordion key={a.q} article={a} />
              ))}
            </div>
          </Card>
        );
      })}

      <Card>
        <div className="flex items-center gap-3 p-5">
          <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
            <LuMail size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800">Didn&apos;t find it?</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Raise a ticket and a person will read it.
            </p>
          </div>
          <Link
            href="/vendor/support/contact"
            className="shrink-0 inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
          >
            Contact support
          </Link>
        </div>
      </Card>
    </div>
  );
}
