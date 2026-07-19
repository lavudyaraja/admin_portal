import Link from "next/link";
import type { IconType } from "react-icons";
import {
  LuDownload, LuShieldCheck, LuZap, LuWifi, LuTrash2,
  LuHeadphones, LuPhone, LuMail, LuHeart, LuPrinter,
  LuCloudUpload, LuCopy,
} from "react-icons/lu";
import { FaGooglePlay, FaApple } from "react-icons/fa6";

/**
 * The starfield behind the dark footer.
 *
 * Positions come from a seeded generator rather than `Math.random()` on purpose:
 * this is a server component, so random values would differ between the server
 * render and the client hydration and React would throw a mismatch. The seed is
 * fixed, so both sides compute the identical field.
 *
 * Sizes are weighted small — a few bright specks against many faint ones is what
 * reads as depth. All motion lives in `.star` in globals.css.
 */
const STAR_COUNT = 70;

const STARS = (() => {
  // Mulberry32 — small, fast, and deterministic from a fixed seed.
  let seed = 0x9e3779b9;
  const rand = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const DRIFTS = ["drift-a", "drift-b", "drift-c", "drift-d", "drift-e", "drift-f"];
  const TWINKLES = ["twinkle-a", "twinkle-b", "twinkle-c"];

  return Array.from({ length: STAR_COUNT }, () => {
    const r = rand();
    // Cube the roll so most stars land small and only a handful are big.
    const size = 1 + Math.round(r * r * r * 3);
    return {
      top: `${(rand() * 100).toFixed(2)}%`,
      left: `${(rand() * 100).toFixed(2)}%`,
      size,
      drift: DRIFTS[Math.floor(rand() * DRIFTS.length)],
      twinkle: TWINKLES[Math.floor(rand() * TWINKLES.length)],
      driftDuration: `${(rand() * 26 + 18).toFixed(1)}s`,
      twinkleDuration: `${(rand() * 4 + 2.5).toFixed(1)}s`,
      // Negative, so the field is already mid-drift on first paint rather than
      // every star starting from the same spot at once.
      delay: `${(rand() * -30).toFixed(1)}s`,
    };
  });
})();

function Stars() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden>
      {STARS.map((s, i) => (
        <span
          key={i}
          className="star absolute rounded-full bg-white"
          style={
            {
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              "--drift": s.drift,
              "--twinkle": s.twinkle,
              "--drift-duration": s.driftDuration,
              "--twinkle-duration": s.twinkleDuration,
              "--delay": s.delay,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/**
 * Footer link columns, in the order they read on desktop.
 *
 * Section anchors are absolute (`/#features`, not `#features`) because the
 * footer also renders on the `(site)` content pages — a bare hash there would
 * look for the section on the current page and do nothing.
 */
const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Supported Printers", href: "/#why-prinsta" },
      { label: "Security & Privacy", href: "/#security" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "For Users",
    links: [
      { label: "Find Printer", href: "/#features" },
      { label: "Download App", href: "/#download" },
      { label: "Help Center", href: "/help" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "For Printer Owners",
    links: [
      { label: "Register Your Printer", href: "/vendor/register?role=vendor" },
      { label: "Partner With Us", href: "/contact" },
      { label: "Resources", href: "/#how-it-works" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Prinsta", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Refund Policy", href: "/refunds" },
    ],
  },
];

/** Reassurances under the store badges. */
const TRUST: { icon: IconType; label: string }[] = [
  { icon: LuShieldCheck, label: "Secure" },
  { icon: LuZap, label: "Fast" },
  { icon: LuWifi, label: "Wi-Fi Printing" },
  { icon: LuTrash2, label: "Auto Delete (2 min)" },
];

export default function Footer() {
  return (
    <footer className="bg-white">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        {/* ── Download banner ── */}
        <section
          id="download"
          className="rounded-3xl bg-gradient-to-br from-rose-50 via-pink-50/60 to-white border border-rose-100 px-5 py-10 sm:px-10 sm:py-12 lg:px-14"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Decorative: it restates the copy beside it and adds nothing for AT.
                The stage is a fixed 420px, wider than this column at lg once the
                banner's own padding is taken off, so it scales down there. */}
            <div className="hidden lg:flex justify-center overflow-hidden" aria-hidden>
              <div className="scale-90 xl:scale-100 origin-center shrink-0">
                <PhonePair />
              </div>
            </div>

            <div className="text-center lg:text-left">
              <span className="inline-flex max-w-full items-center justify-center gap-2 text-center text-balance rounded-full bg-rose-100/80 px-4 py-2 text-xs font-black uppercase tracking-widest text-rose-600">
                <LuDownload size={14} />
                Ready to print smarter?
              </span>

              <h2 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950">
                Download <span className="text-rose-600">Prinsta</span> App
              </h2>

              <p className="mt-3 text-slate-500 text-base sm:text-lg leading-relaxed">
                Upload, pay and print directly from your phone.
                <br className="hidden sm:block" />
                Fast. Secure. Seamless.
              </p>

              <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-3">
                <StoreBadge
                  href="https://play.google.com"
                  icon={FaGooglePlay}
                  kicker="Get it on"
                  name="Google Play"
                />
                <StoreBadge
                  href="https://apps.apple.com"
                  icon={FaApple}
                  kicker="Download on the"
                  name="App Store"
                  iconSize={26}
                />
              </div>

              <ul className="mt-8 flex flex-wrap justify-center lg:justify-start items-center gap-x-6 gap-y-3 sm:divide-x sm:divide-rose-200">
                {TRUST.map(({ icon: Icon, label }, i) => (
                  <li
                    key={label}
                    className={`flex items-center gap-2.5 ${i > 0 ? "sm:pl-6" : ""}`}
                  >
                    <Icon size={18} className="text-rose-500 shrink-0" />
                    <span className="text-sm text-slate-600">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Dark footer ── */}
        <div className="relative isolate mt-6 overflow-hidden rounded-3xl bg-slate-900 text-slate-300 px-5 py-10 sm:px-10 sm:py-12 lg:px-14">
          <Stars />

          {/* Deep-space wash — keeps the corners darker than the middle so the
              stars nearest the edges recede rather than sitting flat. */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,#1e293b_0%,#020617_75%)]"
            aria-hidden
          />

          <div className="relative grid grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-12">
            {/* Brand */}
            <div className="col-span-2 lg:col-span-3">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/adaptive-icon.png" alt="" aria-hidden className="w-20 h-20 object-contain shrink-0 rounded-2xl" />
                <span className="text-white font-black text-3xl tracking-tight">Prinsta</span>
              </div>

              <p className="mt-5 text-slate-400 leading-relaxed">
                Smart Printing.
                <br />
                Anytime. Anywhere.
              </p>
              <p className="mt-5 text-sm text-slate-400 leading-relaxed">
                Upload your documents, pay securely and print instantly on nearby Wi-Fi printers.
              </p>

            </div>

            {/* Link columns */}
            {/* Four link columns only once there's room — at lg they'd be
                ~110px wide and labels like "Register Your Printer" would wrap
                to four lines. */}
            <div className="col-span-2 lg:col-span-6 grid grid-cols-2 xl:grid-cols-4 gap-8">
              {COLUMNS.map((col) => (
                <nav key={col.title}>
                  <h3 className="text-rose-400 font-bold text-xs uppercase tracking-widest">
                    {col.title}
                  </h3>
                  <ul className="mt-5 space-y-3">
                    {col.links.map((l) => (
                      <li key={l.label}>
                        <Link
                          href={l.href}
                          className="text-slate-300 hover:text-white transition-colors text-[15px]"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>

            {/* Help card */}
            <div className="col-span-2 lg:col-span-3">
              <div className="rounded-2xl border border-dashed border-slate-700 p-6">
                <div className="flex items-start gap-3.5">
                  <LuHeadphones size={26} className="text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-rose-400 font-black text-lg leading-tight">Need Help?</p>
                    <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">
                      Our support team is always here to help.
                    </p>
                  </div>
                </div>

                <Link
                  href="/contact"
                  className="mt-5 block w-full rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-center text-sm font-bold py-3 transition-colors"
                >
                  Contact Support
                </Link>

                <div className="mt-5 pt-5 border-t border-slate-700/70 space-y-3">
                  <a
                    href="tel:+917093221536"
                    className="flex items-center gap-3 text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    <LuPhone size={16} className="text-rose-400 shrink-0" />
                    +91 70932 21536
                  </a>
                  <a
                    href="mailto:codeml862@gmail.com"
                    className="flex items-center gap-3 text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    <LuMail size={16} className="text-rose-400 shrink-0" />
                    codeml862@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="relative mt-12 pt-7 border-t border-slate-700/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
            <p>© {new Date().getFullYear()} Prinsta. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              Designed with
              <LuHeart size={14} className="text-rose-500 fill-rose-500" aria-hidden />
              for a smarter printing experience.
            </p>
            <p className="flex items-center gap-2">
              Made in India <span aria-hidden>🇮🇳</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Pieces ────────────────────────────────────────────────────────────────────

function StoreBadge({
  href,
  icon: Icon,
  kicker,
  name,
  iconSize = 22,
}: {
  href: string;
  icon: IconType;
  kicker: string;
  name: string;
  iconSize?: number;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 py-3 transition-colors"
    >
      <Icon size={iconSize} className="shrink-0" aria-hidden />
      <span className="leading-tight text-left">
        <span className="block text-[10px] uppercase tracking-wider text-slate-300">{kicker}</span>
        <span className="block text-lg font-bold -mt-0.5">{name}</span>
      </span>
    </a>
  );
}

/**
 * The two-phone product shot beside the download copy.
 *
 * Absolutely placed inside a fixed stage: an earlier flex version let the two
 * handsets drift apart at different widths, and the overlap is the whole point
 * of the composition.
 */
function PhonePair() {
  return (
    <div className="relative w-[420px] h-[380px]">
      <span className="absolute left-6 top-14 w-56 h-56 rounded-full bg-rose-100/60 blur-2xl" />

      {/* Back phone — the page preview */}
      <div className="absolute left-0 top-16 w-[168px] rounded-[1.75rem] bg-slate-900 p-1.5 shadow-xl -rotate-3">
        <div className="rounded-[1.4rem] bg-white overflow-hidden px-3 pt-3 pb-4">
          <p className="text-[8px] font-semibold text-slate-400">‹ Preview</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[8px] font-bold text-slate-800">Document.pdf</span>
            <span className="rounded bg-rose-100 px-1 py-px text-[6px] font-bold text-rose-600">
              12 Pages
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-1.5">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded border border-slate-200 bg-white p-1.5">
                <div className="space-y-[3px]">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="block h-[2px] rounded-full bg-slate-200"
                      style={{ width: `${100 - (i % 3) * 20}%` }}
                    />
                  ))}
                </div>
                <p className="mt-1 text-[6px] font-bold text-slate-400">{n}</p>
              </div>
            ))}
          </div>

          <p className="mt-2.5 text-[7px] font-semibold text-slate-500">Total Pages 12</p>
          <div className="mt-1.5 rounded-md bg-rose-500 py-1 text-center text-[7px] font-bold text-white">
            Continue
          </div>
        </div>
      </div>

      {/* Front phone — the action list */}
      <div className="absolute left-[132px] top-4 w-[196px] rounded-[2rem] bg-slate-900 p-2 shadow-2xl">
        <div className="absolute left-1/2 -translate-x-1/2 top-2 w-14 h-4 rounded-b-xl bg-slate-900 z-10" />
        <div className="rounded-[1.6rem] bg-white overflow-hidden px-4 pt-8 pb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="mx-auto w-9 h-9 object-contain" />
          <p className="mt-2 text-center text-lg font-black tracking-tight text-slate-900">
            Prinsta
          </p>
          <p className="mt-1 text-center text-[8px] font-bold leading-snug text-rose-500">
            Smart Printing.
            <br />
            Anytime. Anywhere.
          </p>

          <ul className="mt-4 space-y-2">
            {[
              { icon: LuCloudUpload, label: "Upload PDF", tint: "bg-sky-100", ink: "text-sky-600" },
              { icon: LuCopy, label: "Select Pages", tint: "bg-violet-100", ink: "text-violet-600" },
              { icon: LuShieldCheck, label: "Pay Securely", tint: "bg-emerald-100", ink: "text-emerald-600" },
              { icon: LuPrinter, label: "Print Instantly", tint: "bg-amber-100", ink: "text-amber-600" },
            ].map(({ icon: Icon, label, tint, ink }) => (
              <li
                key={label}
                className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-white px-2 py-1.5 shadow-sm"
              >
                <span className={`w-5 h-5 rounded-md ${tint} flex items-center justify-center shrink-0`}>
                  <Icon size={11} className={ink} />
                </span>
                <span className="text-[9px] font-bold text-slate-700">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Paper plane trailing a dashed arc, top right */}
      <svg
        className="absolute right-2 top-6 w-24 h-20 text-rose-200"
        viewBox="0 0 96 80"
        fill="none"
        aria-hidden
      >
        <path
          d="M4 74C22 74 40 62 52 44 62 29 74 18 92 14"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="5 6"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute right-1 top-3 text-rose-400" aria-hidden>
        <svg className="w-9 h-9" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.4 2.6 2.9 10.2c-.9.4-.8 1.7.1 2l4.6 1.5 1.7 5c.3.9 1.5 1 2 .2l2.3-3.4 4.6 3.4c.7.5 1.7.1 1.9-.7l3-14.4c.2-.9-.8-1.6-1.7-1.2Z" />
        </svg>
      </span>
    </div>
  );
}
