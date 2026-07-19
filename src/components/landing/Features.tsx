"use client";

import type { LucideIcon } from "lucide-react";
import { useReveal } from "./useReveal";
import {
  QrCode,
  ScanLine,
  FileText,
  UploadCloud,
  Copy,
  Check,
  Palette,
  Coins,
  Percent,
  Wifi,
  Lock,
  ShieldCheck,
  Clock,
  Zap,
  Star,
  Rocket,
  Usb,
  Laptop,
  Leaf,
} from "lucide-react";

/**
 * The eight-card feature grid.
 *
 * Each card is one capability, illustrated by a tinted disc holding a primary
 * glyph with a small accent badge clipped to its lower-right — the badge is the
 * qualifier (the % on Points, the lock on Wi-Fi), so it always says
 * something the main glyph doesn't.
 *
 * Colour is per-card and carries the grouping: pink for the scan/pay journey,
 * amber for upload/speed, emerald for page selection, violet for
 * colour/security, sky for connectivity.
 */

interface Feature {
  icon: LucideIcon;
  /** Clipped to the lower-right of the disc — the qualifier, never a repeat. */
  badge: LucideIcon;
  title: string;
  desc: string;
  /** Disc fill. */
  tint: string;
  /** Main glyph. */
  glyph: string;
  /** Badge fill. */
  badgeBg: string;
  /** Card title. */
  titleColor: string;
}

const FEATURES: Feature[] = [
  {
    icon: QrCode,
    badge: ScanLine,
    title: "Scan & Connect",
    desc: "Scan the printer's QR code to instantly connect and start your print journey.",
    tint: "bg-rose-100/70",
    glyph: "text-rose-600",
    badgeBg: "bg-rose-500",
    titleColor: "text-rose-600",
  },
  {
    icon: FileText,
    badge: UploadCloud,
    title: "Easy Upload",
    desc: "Upload your PDF from phone gallery or files in just a few taps.",
    tint: "bg-amber-100/70",
    glyph: "text-amber-600",
    badgeBg: "bg-rose-500",
    titleColor: "text-amber-600",
  },
  {
    icon: Copy,
    badge: Check,
    title: "Select Pages",
    desc: "Preview your document and select only the pages you want to print.",
    tint: "bg-emerald-100/70",
    glyph: "text-emerald-600",
    badgeBg: "bg-emerald-500",
    titleColor: "text-emerald-600",
  },
  {
    icon: FileText,
    badge: Palette,
    title: "Color Detection",
    desc: "Prinsta automatically detects color pages and shows accurate pricing.",
    tint: "bg-violet-100/70",
    glyph: "text-violet-600",
    badgeBg: "bg-violet-500",
    titleColor: "text-violet-600",
  },
  {
    icon: Coins,
    badge: Percent,
    title: "Points & UPI Payments",
    desc: "Pay with Prinsta Points (10% off) or any UPI app.",
    tint: "bg-rose-100/70",
    glyph: "text-rose-600",
    badgeBg: "bg-amber-500",
    titleColor: "text-rose-600",
  },
  {
    icon: Wifi,
    badge: Lock,
    title: "Wi-Fi Printing",
    desc: "Send print command over Wi-Fi securely to the printer. No cables. No hassle.",
    tint: "bg-sky-100/70",
    glyph: "text-sky-600",
    badgeBg: "bg-sky-500",
    titleColor: "text-sky-600",
  },
  {
    icon: ShieldCheck,
    badge: Lock,
    title: "Secure & Private",
    desc: "Your files are encrypted and deleted automatically after 2 minutes.",
    tint: "bg-violet-100/70",
    glyph: "text-violet-600",
    badgeBg: "bg-violet-500",
    titleColor: "text-violet-600",
  },
  {
    icon: Clock,
    badge: Zap,
    title: "Fast & Reliable",
    desc: "Lightning fast processing and 99.9% print success rate you can count on.",
    tint: "bg-amber-100/70",
    glyph: "text-amber-600",
    badgeBg: "bg-amber-500",
    titleColor: "text-amber-600",
  },
];

/** The four one-word payoffs in the closing banner. */
const PAYOFFS: { icon: LucideIcon; label: string; color: string }[] = [
  { icon: Usb, label: "No Pen Drive", color: "text-rose-500" },
  { icon: Laptop, label: "No Laptop", color: "text-sky-500" },
  { icon: Clock, label: "Save Time", color: "text-violet-500" },
  { icon: Leaf, label: "Go Paperless", color: "text-emerald-500" },
];

export default function Features() {
  const { ref, seen } = useReveal<HTMLDivElement>();

  return (
    <section id="features" className="py-16 sm:py-24 bg-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Heading ── */}
        <div className="text-center">
          <span className="inline-flex max-w-full items-center justify-center gap-2 text-center text-balance rounded-full bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-rose-600">
            <Star className="h-3.5 w-3.5" strokeWidth={2.5} />
            Powerful Features
          </span>

          <h2 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950">
            <span className="text-rose-600">Prinsta</span> Features
          </h2>

          <p className="mt-3 text-slate-500 text-base sm:text-lg">
            Everything you need for a smooth and smarter printing experience.
          </p>

          <span className="mt-4 mx-auto block h-[3px] w-24 rounded-full bg-rose-500" />
        </div>

        {/* ── Grid ── */}
        <div
          ref={ref}
          className={`reveal-group mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 ${seen ? "is-visible" : ""}`}
        >
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            const Badge = f.badge;
            return (
              <article
                key={f.title}
                style={{ "--i": i } as React.CSSProperties}
                /*
                  Phones read this as a list row — icon left, copy right — because
                  a centred column gives each line only a few words and the card
                  turns into a tall ribbon of text. From `sm` the grid is at least
                  two across and the centred stack works again.
                */
                className="reveal flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white px-4 py-4 text-left sm:block sm:rounded-3xl sm:bg-gray-100 sm:px-6 sm:py-8 sm:text-center"
              >
                <div className="relative h-14 w-14 shrink-0 sm:mx-auto sm:h-28 sm:w-28">
                  <span className={`absolute inset-0 rounded-2xl sm:rounded-full ${f.tint}`} />
                  <Icon
                    className={`absolute inset-0 m-auto h-7 w-7 sm:h-12 sm:w-12 ${f.glyph}`}
                    strokeWidth={1.75}
                  />
                  {/*
                    The badge is hidden on phones. At a 56px disc it lands on the
                    glyph's own edge and reads as a smudge rather than a second
                    mark — it needs the 112px disc to have room to sit clear.
                  */}
                  <span
                    className={`absolute bottom-1 right-1 hidden h-9 w-9 items-center justify-center rounded-full sm:flex ${f.badgeBg} ring-4 ring-gray-100`}
                  >
                    <Badge className="h-4 w-4 text-white" strokeWidth={2.75} />
                  </span>
                </div>

                <div className="min-w-0">
                  <h3
                    className={`text-[15px] leading-snug font-black sm:mt-6 sm:text-lg ${f.titleColor}`}
                  >
                    {f.title}
                  </h3>
                  <p className="mt-1 text-[13px] leading-[1.55] text-slate-500 sm:mt-2 sm:text-sm sm:leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {/* ── Closing banner ── */}
        <div className="mt-12 rounded-3xl bg-rose-50/70 border border-rose-100 px-5 py-6 sm:px-10 sm:py-7">
          <div className="flex flex-col lg:flex-row lg:items-center gap-7">
            <div className="flex items-center gap-4 lg:shrink-0">
              <Rocket className="h-10 w-10 shrink-0 text-rose-500" strokeWidth={2} />
              <div>
                <p className="text-lg font-black text-slate-900">Smart Printing. Simplified.</p>
                <p className="mt-0.5 text-sm text-slate-500 leading-relaxed">
                  Prinsta brings power, privacy and convenience right to your fingertips.
                </p>
              </div>
            </div>

            <div className="hidden lg:block w-px self-stretch bg-rose-200/70" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:flex-1">
              {PAYOFFS.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.label} className="flex items-center gap-2.5">
                    <Icon className={`h-5 w-5 shrink-0 ${p.color}`} strokeWidth={2.25} />
                    <span className="text-sm font-bold text-slate-700">{p.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
