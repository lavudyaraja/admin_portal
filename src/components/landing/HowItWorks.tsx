"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  QrCode,
  UploadCloud,
  Copy,
  ArrowRight,
  CreditCard,
  Printer,
  Rocket,
  Check,
  X,
  FileText,
  Coins,
} from "lucide-react";

/**
 * The five-step "How Prinsta works" rail.
 *
 * Each step is a tinted card holding a phone mockup of the screen the user is
 * on at that moment, an icon chip, and a caption. The mockups are plain markup
 * rather than screenshots so they stay crisp and restyle with the palette.
 */

/**
 * One neutral tone for all five steps.
 *
 * Each step used to carry its own hue — rose, amber, emerald, violet, sky —
 * across its number badge, icon chip, title and card wash. Five saturated
 * colours down a single row read as five unrelated things rather than as one
 * sequence, and the colour carried no meaning: nothing about "Upload PDF" is
 * amber. Graphite for the badges and chips, gray for the copy: the steps now
 * differ only in their number and their artwork, which is the actual difference
 * between them.
 */
const TONE = {
  /** Card fill — a flat grey that actually reads as grey against the white
   *  section, rather than a wash that fades out to the page behind it. */
  card: "bg-gray-100",
  /** Number badge + icon chip fill. */
  solid: "bg-gray-800",
  /** Caption title colour. */
  title: "text-gray-900",
  /** Node ring on the timeline rail. */
  ring: "ring-gray-100",
};

/** Phone chrome — notch, status bar, screen title, then the step's content. */
function Phone({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="relative w-[150px] rounded-[22px] bg-gray-900 p-[3px] shadow-xl shadow-gray-900/15">
      <div className="relative rounded-[19px] bg-white overflow-hidden">
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 h-3 w-12 rounded-full bg-gray-900 z-10" />
        <div className="flex items-center justify-between px-3 pt-2 pb-1 text-[6px] font-semibold text-gray-900">
          <span>9:41</span>
          <span className="flex items-center gap-0.5">
            <span className="h-1 w-1 rounded-full bg-gray-900" />
            <span className="h-1.5 w-1 rounded-sm bg-gray-900" />
            <span className="h-1.5 w-2.5 rounded-[2px] border border-gray-900" />
          </span>
        </div>
        <p className="text-center text-[9px] font-bold text-gray-900 pb-2">{title}</p>
        <div className="px-2.5 pb-4">{children}</div>
      </div>
    </div>
  );
}

/** A stand-in for a page of text — the grey rules inside a document thumbnail. */
function PageLines({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-[3px]">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-[2px] rounded-full bg-gray-200"
          style={{ width: `${100 - (i % 3) * 18}%` }}
        />
      ))}
    </div>
  );
}

/* ---------- 01 · the QR stand next to a phone scanning it ---------- */

function QrArt() {
  return (
    <div className="flex items-end justify-center gap-2">
      <div className="flex flex-col items-center">
        <div className="w-[78px] rounded-lg bg-gradient-to-b from-rose-500 to-pink-600 px-2 pt-2 pb-3 text-center shadow-lg shadow-rose-500/25">
          <p className="text-[7px] font-black tracking-wider text-white">PRINSTA</p>
          <p className="text-[5px] font-semibold text-white/80 mb-1.5">SCAN TO PRINT</p>
          <div className="rounded bg-white p-1">
            <QrCode className="h-11 w-11 text-gray-900" strokeWidth={1.25} />
          </div>
        </div>
        <div className="h-2.5 w-1.5 bg-rose-600" />
        <div className="h-1.5 w-14 rounded-sm bg-rose-600" />
      </div>
      <div className="relative w-[52px] rounded-xl bg-gray-900 p-[2px] shadow-lg">
        <div className="rounded-[10px] bg-white p-2">
          <QrCode className="h-9 w-9 text-gray-900" strokeWidth={1.25} />
        </div>
        <span className="absolute inset-2 rounded border-2 border-rose-500/70" />
      </div>
    </div>
  );
}

/* ---------- 02 · the upload screen ---------- */

function UploadArt() {
  return (
    <Phone title="Upload Document">
      <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50/60 py-5 flex items-center justify-center">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 shadow-md shadow-amber-500/30">
          <UploadCloud className="h-4 w-4 text-white" strokeWidth={2.5} />
        </span>
      </div>
      <p className="mt-2 text-[6px] font-semibold text-gray-400">Choose PDF File</p>
      <div className="mt-1 flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-1">
        <FileText className="h-3 w-3 shrink-0 text-amber-500" strokeWidth={2} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[6px] font-bold text-gray-800">Notes.pdf</span>
          <span className="block text-[5px] text-gray-400">2.4 MB</span>
        </span>
        <X className="h-2.5 w-2.5 shrink-0 text-gray-400" strokeWidth={2.5} />
      </div>
    </Phone>
  );
}

/* ---------- 03 · the page picker, first two pages selected ---------- */

function PagesArt() {
  return (
    <Phone title="Select Pages">
      <div className="grid grid-cols-2 gap-1.5">
        {[1, 2, 3, 4].map((n) => {
          const picked = n <= 2;
          return (
            <div
              key={n}
              className={`relative rounded-md border bg-white p-1.5 ${
                picked ? "border-emerald-500 ring-1 ring-emerald-500/30" : "border-gray-200"
              }`}
            >
              <PageLines />
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[5px] font-bold text-gray-400">{n}</span>
                {picked && (
                  <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-500">
                    <Check className="h-1.5 w-1.5 text-white" strokeWidth={4} />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Phone>
  );
}

/* ---------- 04 · the payment sheet ---------- */

function PaymentArt() {
  return (
    <Phone title="Payment">
      <div className="rounded-lg bg-gray-50 border border-gray-200 py-2 text-center">
        <p className="text-[5px] font-semibold text-gray-400">Total Amount</p>
        <p className="text-[15px] font-black text-gray-900 leading-tight">₹20.00</p>
        <p className="text-[5px] text-gray-400">2 B/W Pages</p>
      </div>
      <p className="mt-2 text-[6px] font-semibold text-gray-400">Choose Payment Method</p>
      <div className="mt-1 space-y-1">
        <div className="flex items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50/60 px-1.5 py-1">
          <Coins className="h-2.5 w-2.5 text-violet-600" strokeWidth={2.5} />
          <span className="flex-1 text-[6px] font-bold text-gray-800">Points</span>
          <span className="rounded-full bg-rose-500 px-1 py-[1px] text-[4px] font-black text-white">
            10% OFF
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-gray-200 px-1.5 py-1">
          <CreditCard className="h-2.5 w-2.5 text-gray-500" strokeWidth={2.5} />
          <span className="flex-1 text-[6px] font-bold text-gray-800">UPI / Other</span>
          <ArrowRight className="h-2 w-2 text-gray-300" strokeWidth={3} />
        </div>
      </div>
    </Phone>
  );
}

/* ---------- 05 · the printer, mid-job ---------- */

function PrinterArt() {
  return (
    <div className="flex flex-col items-center">
      <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
        <Check className="h-5 w-5 text-white" strokeWidth={3.5} />
      </span>
      {/* Fixed width, like the phone mockups either side of it — in the tablet
          row layout the artwork column has no width of its own to fill. */}
      <div className="relative flex h-[160px] w-[150px] items-center justify-center">
        <img
          src="/printer-how-it-works.jpg"
          alt="Prinsta Pantum Printer"
          className="max-h-full max-w-full object-contain rounded-xl border border-gray-100"
        />
      </div>
    </div>
  );
}

/* ---------- steps ---------- */

const STEPS = [
  {
    icon: QrCode,
    title: "Scan QR Code",
    desc: "Scan the QR code on the printer or at the print location.",
    art: <QrArt />,
  },
  {
    icon: UploadCloud,
    title: "Upload PDF",
    desc: "Upload your PDF document directly from your phone.",
    art: <UploadArt />,
  },
  {
    icon: Copy,
    title: "Select Pages",
    desc: "Preview and select the pages you want to print.",
    art: <PagesArt />,
  },
  {
    icon: CreditCard,
    title: "Pay Securely",
    desc: "Pay securely using Points (10% off) or any UPI method.",
    art: <PaymentArt />,
  },
  {
    icon: Printer,
    title: "Print Instantly",
    desc: "Send print command and collect your documents.",
    art: <PrinterArt />,
  },
];

export default function HowItWorks() {
  // `overflow-x-clip`, not `overflow-hidden`: `hidden` would make this the
  // nearest scroll container and the table's sticky stage would never stick.
  // `clip` contains the same horizontal overflow without that.
  return (
    <section id="how-it-works" className="pt-12 pb-16 sm:pt-16 sm:pb-20 bg-white overflow-x-clip">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="inline-flex max-w-full items-center justify-center gap-2 text-center text-balance rounded-full bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-rose-600">
            <Rocket className="h-3.5 w-3.5" strokeWidth={2.5} />
            Simple. Fast. Smart.
          </span>
          <h2 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-gray-950">
            How <span className="text-rose-600">Prinsta</span> Works
          </h2>
          <p className="mt-3 text-gray-500 text-base sm:text-lg">
            From scan to print in just a few simple steps.
          </p>
        </div>

        <RoundTable />


      </div>
    </section>
  );
}

/* ---------- the round table ---------- */

/** Half-width and half-height of the seating ellipse, in px. */
const RX = 300;
const RY = 74;
/** Scroll room each step gets, as a fraction of the viewport height. */
const VH_PER_STEP = 0.55;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * The steps seated around a table.
 *
 * The five steps sit around an elliptical table the way people sit around a
 * dining table, and scrolling the section turns the table: whichever step
 * rotates to the near edge is the one facing the reader, and the panel above
 * shows that step's screen. Scroll is the only input — an earlier version made
 * the steps a tablist and nobody clicks a landing page to see its content.
 *
 * The ellipse is what sells the perspective. Seats are placed at
 * `(RX·sin θ, RY·cos θ)` rather than on a circle, so they sweep wide across the
 * front and shallow across the back, and each seat's scale and opacity come from
 * `cos θ` — near the viewer means larger and solid, the far side means small and
 * faded. That is the whole 3D effect; there is no transform-style: preserve-3d
 * to fight, and it renders identically in every browser.
 *
 * Below lg the table is dropped for a plain stacked list. A rotating table needs
 * both width for the ellipse and vertical room to sit still while the page
 * scrolls past it, and a phone has neither.
 */
function RoundTable() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [turn, setTurn] = useState(0);

  // How far the table has turned, in full revolutions — driven entirely by how
  // far the tall wrapper has been scrolled through.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const el = wrapRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const travel = rect.height - window.innerHeight;
        if (travel <= 0) return;
        const progress = clamp(-rect.top / travel, 0, 1);
        // Stop one seat short of a full revolution, so the last step lands at
        // the front rather than carrying on round to the first again.
        setTurn((progress * (STEPS.length - 1)) / STEPS.length);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const active = ((Math.round(turn * STEPS.length) % STEPS.length) + STEPS.length) % STEPS.length;

  return (
    <>
      {/* ── The table, lg and up ── */}
      <div
        ref={wrapRef}
        className="relative mt-2 hidden lg:block"
        style={{ height: `calc(100vh + ${STEPS.length * VH_PER_STEP * 100}vh)` }}
      >
        <div className="sticky top-0 flex h-screen min-h-[620px] flex-col items-center justify-center gap-6 xl:gap-8">
          {/* ── The dish on the table: whichever step is facing us ── */}
          <div className="relative flex w-full max-w-3xl items-center justify-center">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  aria-hidden={i !== active}
                  className={`flex items-center gap-8 transition-all duration-500 ${
                    i === active
                      ? "opacity-100"
                      : "pointer-events-none absolute translate-y-3 opacity-0"
                  }`}
                >
                  {/* The mockup sits on its own card, so it reads as an object
                      on the page rather than floating loose beside the copy. */}
                  <div
                    className={`flex shrink-0 items-center justify-center rounded-3xl ${TONE.card} border border-gray-200 px-6 py-5`}
                  >
                    {step.art}
                  </div>

                  <div className="max-w-sm">
                    <span
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${TONE.solid} text-white`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2.25} />
                    </span>
                    <p className="mt-4 text-xs font-black uppercase tracking-widest text-gray-400">
                      Step {String(i + 1).padStart(2, "0")} of{" "}
                      {String(STEPS.length).padStart(2, "0")}
                    </p>
                    <h3 className={`mt-1.5 text-3xl font-black tracking-tight ${TONE.title}`}>
                      {step.title}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-gray-500">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── The table itself, with the seats around it ── */}
          <div
            className="relative shrink-0"
            style={{ width: RX * 2 + 200, height: RY * 2 + 96 }}
          >
            {/* Contact shadow on the floor. Without it the table reads as a flat
                ellipse drawn on the page rather than an object standing on one:
                wider than the top, much flatter, and blurred out. */}
            <span
              aria-hidden
              className="absolute left-1/2 top-1/2 rounded-[50%] bg-gray-900/15 blur-2xl"
              style={{
                width: RX * 2 + 40,
                height: RY,
                transform: `translate(-50%, -50%) translateY(${RY + 18}px)`,
              }}
            />

            {/* The edge — the same ellipse pushed down and darkened. The sliver
                that shows below the top surface is what reads as thickness. */}
            <span
              aria-hidden
              className="absolute left-1/2 top-1/2 rounded-[50%] bg-gradient-to-b from-gray-300 to-gray-400"
              style={{
                width: RX * 2,
                height: RY * 2,
                transform: "translate(-50%, -50%) translateY(14px)",
              }}
            />

            {/* Top surface, lit from the far edge so the near edge is darker —
                that gradient direction is what tilts it away from the viewer. */}
            <span
              aria-hidden
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-gradient-to-b from-white via-gray-100 to-gray-200 ring-1 ring-gray-300/60"
              style={{ width: RX * 2, height: RY * 2 }}
            />

            {/* The placemat ring the seats are set around. */}
            <span
              aria-hidden
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-dashed border-gray-300"
              style={{ width: RX * 2 - 70, height: RY * 2 - 34 }}
            />

            {/* The name at the centre of the table — the thing all five steps
                are seated around. */}
            <span
              aria-hidden
              className="absolute left-1/2 top-1/2 z-[60] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            >
              <span className="text-[26px] font-black tracking-tight text-gray-800">Prinsta</span>
              <span className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Self-service printing
              </span>
            </span>

            {STEPS.map((step, i) => {
              const theta = (i / STEPS.length - turn) * Math.PI * 2;
              // 1 at the near edge, 0 at the far edge.
              const depth = (Math.cos(theta) + 1) / 2;
              const scale = 0.66 + depth * 0.34;
              const current = i === active;
              return (
                <span
                  key={step.title}
                  aria-hidden
                  className="absolute left-1/2 top-1/2 flex flex-col items-center"
                  /*
                   * Rounded, not because the precision costs anything to
                   * compute, but because these values are compared at
                   * hydration. The server writes the full float into the
                   * markup, the browser re-serialises it to its own precision
                   * when parsing, and React then finds `-176.3355756877419px`
                   * where the DOM holds `-176.336px` and reports a mismatch.
                   * Three decimals is below what the browser rounds to, so both
                   * sides agree — and is far finer than a pixel.
                   */
                  style={{
                    transform: `translate(-50%, -50%) translate(${(RX * Math.sin(theta)).toFixed(
                      3
                    )}px, ${(RY * Math.cos(theta)).toFixed(3)}px) scale(${scale.toFixed(3)})`,
                    // Never near-transparent: a seat that fades out at the back
                    // makes the table look like it has three chairs, not five.
                    opacity: Number((0.5 + depth * 0.5).toFixed(3)),
                    zIndex: Math.round(depth * 100),
                  }}
                >
                  <span
                    className={`flex h-16 w-16 items-center justify-center rounded-full text-base font-black ring-4 ring-white transition-colors duration-500 ${
                      current
                        ? `${TONE.solid} text-white shadow-xl shadow-gray-900/25`
                        : "bg-gray-200 text-gray-500 shadow-md shadow-gray-900/10"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* Only the seat facing us is named — five labels around the
                      table at five different scales is noise. */}
                  <span
                    className={`mt-2.5 whitespace-nowrap text-[13px] font-bold transition-opacity duration-500 ${
                      current ? "text-gray-900 opacity-100" : "opacity-0"
                    }`}
                  >
                    {step.title}
                  </span>
                </span>
              );
            })}
          </div>


        </div>
      </div>

      {/* ── Stacked list, below lg ── */}
      <ol className="mt-12 space-y-10 lg:hidden">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <li key={step.title} className="flex gap-5 sm:gap-7">
              <span
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${TONE.solid} text-sm font-black text-white shadow-lg`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="min-w-0 flex-1 pt-1.5">
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${TONE.solid} text-white`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                </span>
                <h3 className={`mt-4 text-xl font-black tracking-tight sm:text-2xl ${TONE.title}`}>
                  {step.title}
                </h3>
                <p className="mt-2 max-w-md text-[15px] leading-relaxed text-gray-500">
                  {step.desc}
                </p>
                <div
                  className={`mt-6 flex justify-center rounded-3xl ${TONE.card} border border-gray-200 px-4 py-8`}
                >
                  {step.art}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
