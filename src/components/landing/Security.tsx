import {
  ShieldCheck,
  Trash2,
  Lock,
  CloudOff,
  CreditCard,
  Wifi,
  UserRound,
  Sparkles,
} from "lucide-react";

type Claim = {
  icon: typeof Trash2;
  title: string;
  desc: string;
};

const LEFT: Claim[] = [
  {
    icon: Trash2,
    title: "Auto File Deletion",
    desc: "Files are automatically deleted from our servers within 2 minutes after printing.",
  },
  {
    icon: Lock,
    title: "Encrypted Uploads",
    desc: "All uploads are encrypted using industry-standard SSL/TLS security.",
  },
  {
    icon: CloudOff,
    title: "No Permanent Storage",
    desc: "We don't store, share or sell your documents. Ever. Your data stays private.",
  },
];

/* Three a side. The column used to hold two, which left the right-hand stack
   visibly shorter than the left and the shield off-centre between them. */
const RIGHT: Claim[] = [
  {
    icon: CreditCard,
    title: "Secure Payments",
    desc: "All payments are processed securely via trusted partners like Razorpay.",
  },
  {
    icon: Wifi,
    title: "Safe Wi-Fi Printing",
    desc: "Direct and secure connection to printers. Your files are never exposed.",
  },
  {
    icon: UserRound,
    title: "Only You Collect",
    desc: "Jobs are released only at the printer you scanned, so nobody else picks them up.",
  },
];

function ClaimCard({ icon: Icon, title, desc }: Claim) {
  return (
    /* `flex-1` so the three cards in a column share its height evenly and both
       columns line up, whatever the description lengths are. The border is a
       full rose-200 rather than a 100/80 tint — against a white section the
       tint was effectively invisible and the cards read as loose text. */
    <article className="flex flex-1 gap-4 rounded-2xl border border-rose-200 bg-white px-5 py-4 shadow-sm shadow-rose-900/5 transition-shadow hover:shadow-md hover:shadow-rose-900/10">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50">
        <Icon className="h-5 w-5 text-rose-500" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-black text-rose-600">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">{desc}</p>
      </div>
    </article>
  );
}

export default function Security() {
  return (
    <section id="security" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Heading ── */}
        <div className="text-center">
          <span className="inline-flex max-w-full items-center justify-center gap-2 text-center text-balance rounded-full bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-rose-600">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
            Your data. Always protected.
          </span>

          <h2 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950">
            Security &amp; <span className="text-rose-600">Privacy</span>
          </h2>

          <p className="mt-4 mx-auto max-w-xl text-slate-500 text-base sm:text-lg leading-relaxed">
            At Prinsta, your documents and data are safe with us. We follow strict security
            practices to protect your privacy.
          </p>
        </div>

        {/* ── Claims, flanking the shield ── */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-10 items-stretch">
          <div className="order-2 flex flex-col gap-4 lg:order-1">
            {LEFT.map((c) => (
              <ClaimCard key={c.title} {...c} />
            ))}
          </div>

          {/* Shield */}
          {/* Vertical padding gives the overspilling rings room, so on a phone
              they don't run into the claim cards stacked above and below. */}
          <div className="order-1 lg:order-2 flex flex-col items-center justify-center py-10 lg:py-0">
            {/*
              Concentric rings around the lock. The outermost is drawn with a
              NEGATIVE inset, so it is larger than the 256px stage rather than
              nested inside it — the stage keeps its size in the grid while the
              halo overspills it, which is what makes the lock read as the
              centre of something rather than as a badge in a circle. Kept to
              -inset-6: further out and it runs into the caption below.
            */}
            <div className="relative flex h-64 w-64 items-center justify-center">
              <span className="absolute -inset-6 rounded-full border border-rose-100 bg-rose-50/50" />
              <span className="absolute inset-0 rounded-full bg-rose-100/40" />
              <span className="absolute inset-6 rounded-full border border-dashed border-rose-200" />

              {/* Sparkles scattered across the halo rather than clustered on
                  one side of the lock. */}
              <Sparkles
                className="absolute left-3 top-12 h-5 w-5 text-rose-200"
                strokeWidth={2}
              />
              <Sparkles
                className="absolute right-5 top-16 h-4 w-4 text-rose-200"
                strokeWidth={2}
              />
              <Sparkles
                className="absolute -left-3 bottom-16 h-4 w-4 text-rose-200"
                strokeWidth={2}
              />
              <Sparkles
                className="absolute -right-2 top-8 h-5 w-5 text-rose-200"
                strokeWidth={2}
              />

              <div className="relative flex h-40 w-40 items-center justify-center rounded-[2.5rem] bg-gradient-to-b from-rose-400 to-pink-600">
                <Lock className="h-16 w-16 text-white" strokeWidth={2.25} />
                <span className="absolute -bottom-3 -right-3 flex h-14 w-14 items-center justify-center rounded-full bg-white">
                  <svg
                    className="h-7 w-7 text-rose-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Clear of the outer ring rather than sitting on it — `relative` keeps it
                above the ring if a narrow column ever pulls the two together. */}
            <div className="relative mt-8 flex items-center gap-3 rounded-2xl border border-rose-200 bg-white px-5 py-3 shadow-sm shadow-rose-900/5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50">
                <Lock className="h-4 w-4 text-rose-500" strokeWidth={2.5} />
              </span>
              <div>
                <p className="text-sm font-black text-slate-900">We don&apos;t store your files.</p>
                <p className="text-xs text-slate-500">Your privacy is our priority.</p>
              </div>
            </div>
          </div>

          <div className="order-3 flex flex-col gap-4">
            {RIGHT.map((c) => (
              <ClaimCard key={c.title} {...c} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
