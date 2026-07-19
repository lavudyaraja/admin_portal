"use client";

import {
  Smartphone,
  Rocket,
  ShieldCheck,
  Wifi,
  Coins,
  FileText,
  BadgeCheck,
  Headset,
  Heart,
} from "lucide-react";
import { useReveal } from "./useReveal";
import Carousel, { type Slide } from "./Carousel";

/**
 * The kiosk showcase, in order.
 *
 * These reuse the photos already in /public. Swapping in real kiosk shots is a
 * matter of dropping files there and editing this list — nothing below reads the
 * filenames.
 */
const KIOSK_SLIDES: Slide[] = [
  {
    src: "/kiosk-landing.jpg",
    alt: "A Prinsta self-service printing kiosk installed in a campus shop",
    caption: "Self-service kiosks, installed where students already are",
  },
  {
    src: "/printer-how-it-works.jpg",
    alt: "A student sending a document to a Prinsta printer from their phone",
    caption: "Scan, upload, pay — the printer starts before you reach it",
  },
  {
    src: "/hero_section.png",
    alt: "The Prinsta app and kiosk shown side by side",
    caption: "One app for every Prinsta printer on campus",
  },
];

type Reason = {
  icon: typeof Smartphone;
  title: string;
  desc: string;
  tint: string;
  accent: string;
};

const REASONS: Reason[] = [
  {
    icon: Smartphone,
    title: "No Pen Drive. No Worries.",
    desc: "Upload your files from your phone and print directly. No pendrive or laptop needed.",
    tint: "bg-rose-100/70",
    accent: "text-rose-600",
  },
  {
    icon: Rocket,
    title: "Super Fast & Easy",
    desc: "From upload to print in just few taps. Save your time for what matters more.",
    tint: "bg-orange-100/70",
    accent: "text-orange-600",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Private",
    desc: "Your files are encrypted and auto deleted after 2 minutes. Your privacy is our priority.",
    tint: "bg-violet-100/70",
    accent: "text-violet-600",
  },
  {
    icon: Wifi,
    title: "Works with Wi-Fi Printers",
    desc: "Connect and print on any Wi-Fi enabled printer instantly and securely.",
    tint: "bg-sky-100/70",
    accent: "text-sky-600",
  },
  {
    icon: Coins,
    title: "Points Benefits",
    desc: "Top up Prinsta Points and get 10% instant discount on every print.",
    tint: "bg-teal-100/70",
    accent: "text-teal-600",
  },
  {
    icon: FileText,
    title: "Smart PDF Preview",
    desc: "Preview your document, select pages and know the cost before you pay.",
    tint: "bg-rose-100/70",
    accent: "text-rose-600",
  },
  {
    icon: BadgeCheck,
    title: "Safe Payments",
    desc: "Pay securely using UPI or Points. Powered by trusted payment partners.",
    tint: "bg-emerald-100/70",
    accent: "text-emerald-600",
  },
  {
    icon: Headset,
    title: "Always Here for You",
    desc: "Facing an issue? Our support team is always ready to help you.",
    tint: "bg-amber-100/70",
    accent: "text-amber-600",
  },
];

export default function WhyChoose() {
  const { ref, seen } = useReveal<HTMLDivElement>();

  return (
    <section id="why-prinsta" className="py-16 sm:py-24 bg-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Heading ── */}
        <div className="text-center">
          <span className="inline-flex max-w-full items-center justify-center gap-2 text-center text-balance rounded-full bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-rose-600">
            <Heart className="h-3.5 w-3.5" strokeWidth={2.5} />
            Built for simplicity. Designed for you.
          </span>

          <h2 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950">
            Why Choose <span className="text-rose-600">Prinsta?</span>
          </h2>

          <p className="mt-3 text-slate-500 text-base sm:text-lg">
            Prinsta makes printing smarter, faster and completely hassle-free.
          </p>
        </div>

        {/* ── Grid ── */}
        <div
          ref={ref}
          className={`reveal-group mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 ${seen ? "is-visible" : ""}`}
        >
          {REASONS.map((r, i) => {
            const Icon = r.icon;
            return (
              <article
                key={r.title}
                style={{ "--i": i } as React.CSSProperties}
                /* Icon left / copy right on phones — see the note in Features. */
                className="reveal flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white px-4 py-4 text-left sm:block sm:rounded-3xl sm:bg-gray-100 sm:px-6 sm:py-8 sm:text-center"
              >
                <div className="relative h-14 w-14 shrink-0 sm:mx-auto sm:h-24 sm:w-24">
                  <span className={`absolute inset-0 rounded-2xl sm:rounded-full ${r.tint}`} />
                  <Icon
                    className={`absolute inset-0 m-auto h-7 w-7 sm:h-11 sm:w-11 ${r.accent}`}
                    strokeWidth={1.75}
                  />
                </div>

                <div className="min-w-0">
                  <h3
                    className={`text-[15px] font-black leading-snug sm:mt-6 sm:text-base ${r.accent}`}
                  >
                    {r.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-[1.55] text-slate-500 sm:mt-3 sm:text-sm sm:leading-relaxed">
                    {r.desc}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {/* ── Kiosk showcase ── */}
        <div className="mt-16 flex justify-center">
          <Carousel slides={KIOSK_SLIDES} className="w-full max-w-4xl" />
        </div>
      </div>
    </section>
  );
}
