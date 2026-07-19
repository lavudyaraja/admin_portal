"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LuUser,
  LuPrinter,
  LuShieldCheck,
  LuChevronDown,
  LuPlus,
  LuHeadphones,
  LuArrowRight,
  LuSparkle,
  LuCheckCheck,
} from "react-icons/lu";

type Category = "users" | "operators" | "security";

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: Record<Category, FAQItem[]> = {
  users: [
    {
      q: "Do I need to install an app to print?",
      a: "No. You can scan the printer's QR code and print immediately using our web portal, or install the Prinsta mobile app for a faster, one-tap printing experience.",
    },
    {
      q: "What file formats are supported for printing?",
      a: "We support PDFs, Word documents (DOCX), PowerPoint presentations (PPTX), and high-resolution images (PNG, JPG). For the most accurate layout rendering, we highly recommend using PDF.",
    },
    {
      q: "How do I pay for my print jobs?",
      a: "You can pay instantly using any UPI app (GPay, PhonePe, Paytm), credit/debit cards, net banking, or top up Prinsta Points for quick checkouts and extra discounts.",
    },
    {
      q: "Where can I find an active Prinsta kiosk?",
      a: "Use the interactive map in the Prinsta app or website to view active kiosks, check their real-time status (online/busy/toner level), and get directions to the closest machine.",
    },
    {
      q: "Can I configure print settings like double-sided or color?",
      a: "Yes. You have complete control over settings: select between black-and-white or color, single-sided or double-sided printing, choose page ranges, paper sizes, and the number of copies.",
    },
    {
      q: "How much does printing cost?",
      a: "Pricing is set by the kiosk operator. The live cost is calculated and displayed on your screen instantly as you adjust your print settings, before you make any payment.",
    },
    {
      q: "What happens if my document has formatting issues?",
      a: "We render standard files using cloud layout engines. To prevent any formatting deviations (such as font changes or shifted margins), please convert your document to PDF before uploading.",
    },
    {
      q: "Can I cancel a print job after paying?",
      a: "Once a job is sent to the printer, it cannot be canceled as printing begins immediately. However, if the job fails to print due to a hardware issue, a refund will be processed automatically.",
    },
    {
      q: "How do I check my print job status?",
      a: "After payment, you will see a live progress screen showing your job transition from 'Paid' to 'Queued', 'Printing', and finally 'Completed'. You will also receive an invoice in the app.",
    },
    {
      q: "Can I reprint a document from my history?",
      a: "Yes. Your print history contains previous orders. You can re-initiate a print job for any past order without needing to upload the file again, provided it is within the transient retention window.",
    },
  ],
  operators: [
    {
      q: "How do payments reach me as a shop owner?",
      a: "Payments are collected securely via our integrated payment gateway and settled directly to your registered bank account on a rolling basis. All Points transactions are tracked instantly in the ledger.",
    },
    {
      q: "Which printers are supported?",
      a: "Prinsta works with any network-capable (Wi-Fi or Ethernet) printer that supports standard protocols. You can register your printer's brand, model, and IP/MAC address via the Admin Console in seconds.",
    },
    {
      q: "Is there a platform commission?",
      a: "During our beta period, there is a 0% platform commission — you keep 100% of your printing revenue. Standard platform fees will be pre-announced and will always remain highly competitive.",
    },
    {
      q: "How do I manage paper and toner refills?",
      a: "The Admin Console gives you live tracking of paper levels and toner capacity. You will receive automated alerts when resources are running low so you can restock before any kiosk goes offline.",
    },
    {
      q: "Can I set custom pricing for my printers?",
      a: "Yes, you have full control over pricing. You can configure individual cost-per-page rates for black-and-white vs. color pages, as well as duplex settings, for each registered printer.",
    },
    {
      q: "How do I generate and print QR codes for my kiosks?",
      a: "When you register a printer, a unique QR code is automatically generated. You can download and print the high-resolution QR poster directly from the Admin Console to paste on your printer kiosk.",
    },
    {
      q: "What happens if a printer goes offline?",
      a: "If a printer loses connection or power, the platform automatically flags it as offline. New print jobs will be blocked for this printer, and any pending queue will wait or refund the users if they time out.",
    },
    {
      q: "How do I add multiple operators or staff to my account?",
      a: "The Admin Console supports Role-Based Access Control (RBAC). You can invite staff members as 'Operators' who can monitor printer status and assist users without having access to your financial revenue settings.",
    },
    {
      q: "Can I run promotions or discounts for my users?",
      a: "Yes. You can configure discount codes or special Points top-up bonuses through the promotions panel in the Admin Console to incentivize higher usage at your printing stations.",
    },
    {
      q: "What support resources do you provide for hardware issues?",
      a: "We handle the software, payment gateway, and queue management. If a printer has physical hardware issues, our support system alerts you instantly, and our documentation provides troubleshooting steps for standard printer brands.",
    },
  ],
  security: [
    {
      q: "What happens to uploaded documents?",
      a: "Privacy is our absolute priority. Documents are encrypted during transit, processed temporarily on our secure print servers, and completely deleted the moment the printer finishes printing. We do not store files long-term.",
    },
    {
      q: "How is the print queue managed?",
      a: "We use an advanced cloud queuing worker with transactional locking. This ensures print jobs are dispatched one by one in the exact order of payment, preventing conflicts even under heavy campus traffic.",
    },
    {
      q: "What if my print job fails?",
      a: "If a print job fails due to a printer error (e.g., paper jam or power outage), the system automatically cancels the job after 3 attempts and issues an instant refund directly to the student's Points balance.",
    },
    {
      q: "Is my payment information secure?",
      a: "Absolutely. All payments are processed through PCI-DSS compliant gateways. Prinsta does not store or process card numbers or banking passwords on its servers.",
    },
    {
      q: "How is user data protected?",
      a: "We store only essential account details (name, email, phone number) in our Neon PostgreSQL database. We use bcrypt hashing for passwords and role-scoped JWT tokens to prevent unauthorized access.",
    },
  ],
};

export default function FAQ() {
  const [activeTab, setActiveTab] = useState<Category>("users");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const tabs = [
    { id: "users", label: "For Users", icon: LuUser },
    { id: "operators", label: "For Operators", icon: LuPrinter },
    { id: "security", label: "Privacy & Security", icon: LuShieldCheck },
  ] as const;

  const currentFaqs = FAQS[activeTab];

  function handleTabChange(tabId: Category) {
    setActiveTab(tabId);
    // Collapse on switch — carrying an open index across tabs would expand an
    // unrelated question at the same position.
    setOpenIndex(null);
  }

  return (
    <section id="faq" className="py-12 sm:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white px-5 py-10 sm:px-10 sm:py-12 lg:px-14">
          {/* ── Heading, with the illustration alongside ── */}
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block max-w-full text-balance rounded-full bg-rose-100/70 px-4 py-2 text-sm font-bold text-rose-600">
                Got Questions? We&apos;ve Got Answers
              </span>

              <h2 className="mt-6 text-3xl sm:text-4xl lg:text-6xl font-black tracking-tight leading-[0.95]">
                <span className="text-slate-950">Frequently Asked</span>
                <br />
                <span className="text-rose-600">Questions</span>
              </h2>

              <p className="mt-5 text-slate-500 text-base sm:text-lg leading-relaxed">
                Everything you need to know about Prinsta.
                <br className="hidden sm:block" />
                Can&apos;t find the answer you&apos;re looking for? Contact our support team.
              </p>
            </div>

            <div className="hidden lg:flex justify-center" aria-hidden>
              <SpeechBubbles />
            </div>
          </div>

          {/* ── Accordion + support card ── */}
          <div className="mt-14 grid lg:grid-cols-[1fr_340px] gap-8 items-start">
            <div>
              {/* Category tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${isActive
                        ? "bg-rose-500 text-white"
                        : "bg-white text-slate-500 border border-slate-200 hover:text-slate-800"
                        }`}
                    >
                      <Icon size={15} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Questions */}
              <div className="space-y-3">
                {currentFaqs.map((f, i) => {
                  const isOpen = openIndex === i;
                  return (
                    <div
                      key={f.q}
                      className={`rounded-2xl bg-white border transition-colors ${isOpen ? "border-rose-200" : "border-slate-100"
                        }`}
                    >
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : i)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center gap-4 px-5 py-4 text-left"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white">
                          <LuPlus
                            size={14}
                            strokeWidth={3}
                            className={`transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
                          />
                        </span>

                        <span className="flex-1 text-[15px] font-bold text-slate-900">{f.q}</span>

                        <LuChevronDown
                          size={18}
                          className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                            }`}
                        />
                      </button>

                      {/* Grid-rows collapse: animates to the answer's natural
                          height without measuring it in JS. */}
                      <div
                        className={`grid transition-all duration-200 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                          }`}
                      >
                        <div className="overflow-hidden">
                          <p className="px-5 pb-5 pl-14 sm:pl-16 text-sm leading-relaxed text-slate-500">
                            {f.a}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Support card — sticks alongside the list on desktop, where the
                question list is long enough to scroll past it. */}
            <aside className="rounded-3xl bg-rose-50/70 border border-rose-100 px-6 py-8 sm:px-8 sm:py-10 text-center lg:sticky lg:top-24">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white">
                <LuHeadphones size={28} className="text-rose-500" />
              </span>

              <h3 className="mt-6 text-xl font-black tracking-tight text-slate-950">
                Still Have Questions?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Our support team is here to help you anytime, anywhere.
              </p>

              <Link
                href="/contact"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 px-6 py-3 text-sm font-bold text-white transition-colors"
              >
                Contact Support
                <LuArrowRight size={16} />
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * The illustration beside the heading — a support thread, mid-conversation.
 *
 * It replaced a large rose bubble with a "?" in it. That said only "this is a
 * FAQ", which the heading three inches to its left already says, and it said it
 * in the loudest element on the section. A real exchange instead answers one of
 * the questions on the spot and shows what asking Prinsta actually looks like,
 * typing indicator and all.
 *
 * Markup rather than an image, so it stays crisp and follows the palette.
 */
function SpeechBubbles() {
  return (
    <div className="relative w-[340px]">
      {/* Soft ground behind the thread, so it doesn't float on bare white. */}
      <span className="absolute -inset-6 rounded-[2.5rem] bg-rose-50/70" />
      <LuSparkle className="absolute -left-1 top-8 h-5 w-5 text-rose-300" />
      <LuSparkle className="absolute -right-1 bottom-10 h-4 w-4 text-rose-300" />

      <div className="relative flex flex-col gap-3">
        {/* ── Asked ── */}
        <div className="flex justify-end">
          <div className="max-w-[230px] rounded-2xl rounded-br-md bg-gradient-to-br from-rose-500 to-pink-600 px-4 py-2.5 shadow-lg shadow-rose-500/25">
            <p className="text-[13px] font-semibold leading-snug text-white">
              Is my PDF safe after printing?
            </p>
            <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-white/70">
              9:41
              {/* Double tick — read. */}
              <LuCheckCheck className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* ── Answered ── */}
        <div className="flex items-end gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 shadow-md">
            <LuPrinter className="h-4 w-4 text-white" />
          </span>
          <div className="max-w-[240px] rounded-2xl rounded-bl-md border border-slate-100 bg-white px-4 py-2.5 shadow-lg shadow-slate-900/5">
            <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">Prinsta</p>
            <p className="mt-0.5 text-[13px] leading-snug text-slate-600">
              Deleted from our servers within 2 minutes. We never store or share it.
            </p>
          </div>
        </div>

        {/* ── Still typing ── */}
        <div className="flex items-end gap-2">
          <span className="h-8 w-8 shrink-0" />
          <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-100 bg-white px-4 py-3 shadow-lg shadow-slate-900/5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 animate-pulse rounded-full bg-rose-300"
                // Staggered, so the three dots read as a typing indicator rather
                // than as one element blinking three times as wide.
                style={{ animationDelay: `${i * 180}ms` }}
              />
            ))}
          </div>
        </div>

        {/* ── Reassurance, tucked under the thread ── */}
        <div className="mt-1 flex items-center gap-2 self-start rounded-full border border-rose-200 bg-white px-3.5 py-1.5 shadow-sm">
          <LuHeadphones className="h-3.5 w-3.5 shrink-0 text-rose-500" />
          <span className="text-[11px] font-bold text-slate-600">Usually replies in minutes</span>
        </div>
      </div>
    </div>
  );
}
