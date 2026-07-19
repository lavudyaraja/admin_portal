import Link from "next/link";
import { LuHouse, LuCompass, LuLayoutGrid, LuTag, LuHeadphones, LuArrowRight } from "react-icons/lu";
import Navbar from "@/components/landing/Navbar";

/**
 * Root 404.
 *
 * Lives at the app root so it also catches unknown paths under /vendor and
 * /admin, not just the marketing pages.
 */

const SUGGESTIONS = [
  { icon: LuHouse, title: "Go to Homepage", hint: "Back to where it all starts", href: "/" },
  { icon: LuLayoutGrid, title: "Browse Features", hint: "See what Prinsta can do", href: "/#features" },
  { icon: LuTag, title: "View Pricing", hint: "Find the best plan for you", href: "/pricing" },
  { icon: LuHeadphones, title: "Contact Support", hint: "We're here to help you", href: "/contact" },
];

export default function NotFound() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-rose-50/40 to-white font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-16">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* ── Copy ── */}
          <div className="text-center lg:text-left">
            <p className="text-7xl sm:text-8xl xl:text-9xl font-black tracking-tight leading-none">
              <span className="text-slate-900">4</span>
              <span className="text-rose-500">0</span>
              <span className="text-slate-900">4</span>
            </p>

            <h1 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
              <span className="text-rose-600">Oops!</span>{" "}
              <span className="text-slate-900">Page Not Found</span>
            </h1>

            <p className="mt-4 text-slate-500 text-base sm:text-lg leading-relaxed">
              The page you&apos;re looking for doesn&apos;t exist
              <br className="hidden sm:block" />
              or has been moved to another place.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row justify-center lg:justify-start gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-6 py-3.5 transition-colors"
              >
                <LuHouse size={17} />
                Go to Home
              </Link>
              <Link
                href="/#features"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-sm font-bold px-6 py-3.5 transition-colors"
              >
                <LuCompass size={17} />
                Explore Prinsta
              </Link>
            </div>
          </div>

          {/* ── Illustration — decorative, the copy beside it says the same ── */}
          <div className="hidden lg:flex justify-center overflow-hidden" aria-hidden>
            <div className="scale-90 xl:scale-100 origin-center shrink-0">
              <SadPrinter />
            </div>
          </div>
        </div>

        {/* ── Suggestions ── */}
        <section className="mt-14 rounded-3xl bg-white border border-slate-100 px-5 py-7 sm:px-8 shadow-sm">
          <h2 className="text-base font-black text-slate-900">You can try:</h2>
          <span className="mt-2 block h-[3px] w-10 rounded-full bg-rose-500" />

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-0">
            {SUGGESTIONS.map(({ icon: Icon, title, hint, href }, i) => (
              <Link
                key={title}
                href={href}
                className={`flex items-center gap-3.5 group ${
                  i > 0 ? "lg:border-l lg:border-slate-100 lg:pl-6" : ""
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 group-hover:bg-rose-100 transition-colors">
                  <Icon size={19} className="text-rose-500" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900">{title}</span>
                  <span className="block text-xs text-slate-500 leading-snug">{hint}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <p className="mt-8 text-center text-sm text-slate-500">
          Still need help?{" "}
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 font-bold text-rose-600 hover:underline underline-offset-4"
          >
            Contact our support team
            <LuArrowRight size={15} />
          </Link>
        </p>
      </main>
    </div>
  );
}

/**
 * A printer that has given up, mid-jam.
 *
 * Built in markup rather than shipped as an image so it stays crisp and follows
 * the palette. Fixed 420x360 stage with absolute children — the speech bubble
 * and the ejected sheet have to hold their positions relative to the body.
 */
function SadPrinter() {
  return (
    <div className="relative h-[360px] w-[420px]">
      {/* Soft blob behind the scene */}
      <span className="absolute left-10 top-6 h-72 w-80 rounded-[45%_55%_50%_50%] bg-rose-50" />

      {/* Speech bubble */}
      <div className="absolute left-16 top-0 flex h-20 w-20 items-center justify-center rounded-full rounded-br-md bg-white shadow-lg">
        <span className="text-3xl font-black text-rose-500">?</span>
      </div>

      {/* Dashed arc + paper plane */}
      <svg className="absolute right-6 top-8 w-32 h-24 text-slate-300" viewBox="0 0 128 96" fill="none">
        <path
          d="M4 88C30 84 52 70 68 48 80 31 96 18 120 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="5 7"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute right-0 top-2 text-rose-400">
        <svg className="w-11 h-11" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.4 2.6 2.9 10.2c-.9.4-.8 1.7.1 2l4.6 1.5 1.7 5c.3.9 1.5 1 2 .2l2.3-3.4 4.6 3.4c.7.5 1.7.1 1.9-.7l3-14.4c.2-.9-.8-1.6-1.7-1.2Z" />
        </svg>
      </span>

      {/* Scattered marks */}
      <span className="absolute left-4 top-[135px] h-4 w-4 rounded-full border-2 border-rose-200" />
      <span className="absolute right-[136px] bottom-[96px] text-slate-200 text-2xl font-black">✕</span>
      <span className="absolute right-4 top-[100px] h-2.5 w-2.5 rounded-full border-2 border-slate-200" />

      {/* ── Printer ── */}
      <div className="absolute left-[86px] top-[120px] w-[250px]">
        {/* Lid */}
        <div className="mx-auto h-6 w-[86%] rounded-lg bg-slate-800" />

        {/* Upper body, with the face */}
        <div className="relative mt-1 h-[86px] rounded-2xl bg-white border border-slate-200 shadow-xl">
          {/* Eyes */}
          <span className="absolute left-[70px] top-7 h-3.5 w-3.5 rounded-full bg-slate-800" />
          <span className="absolute right-[70px] top-7 h-3.5 w-3.5 rounded-full bg-slate-800" />
          {/* Frown */}
          <span className="absolute left-1/2 top-[52px] h-4 w-9 -translate-x-1/2 rounded-b-full border-b-[3px] border-slate-800" />
          {/* Status lights */}
          <span className="absolute right-4 top-6 h-2 w-2 rounded-full bg-rose-400" />
          <span className="absolute right-4 top-11 h-2 w-2 rounded-full bg-slate-300" />
        </div>

        {/* Lower body */}
        <div className="h-9 rounded-b-2xl bg-slate-800" />

        {/* Ejected sheet, with the failed job on it */}
        <div className="absolute -bottom-[62px] left-6 w-[150px] rounded-md bg-white border border-slate-200 shadow-lg px-5 py-4">
          <svg
            className="mx-auto h-9 w-9 text-rose-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
          <div className="mt-3 space-y-1.5">
            <span className="block h-1 rounded-full bg-slate-200" />
            <span className="block h-1 w-3/4 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>

      {/* Plant, to the right of the printer */}
      <div className="absolute right-[26px] bottom-[38px] w-16">
        <svg className="mx-auto h-16 w-16 text-rose-400" viewBox="0 0 64 64" fill="currentColor">
          <path d="M32 62V26" stroke="currentColor" strokeWidth="2.5" fill="none" />
          <ellipse cx="20" cy="30" rx="7" ry="12" transform="rotate(-28 20 30)" opacity=".85" />
          <ellipse cx="44" cy="28" rx="7" ry="12" transform="rotate(28 44 28)" opacity=".85" />
          <ellipse cx="32" cy="16" rx="6.5" ry="12" opacity=".9" />
        </svg>
        <div className="-mt-1 mx-auto h-12 w-14 rounded-b-2xl rounded-t-md bg-white border border-slate-200 shadow-md" />
      </div>

      {/* Ground shadow */}
      <span className="absolute left-[70px] bottom-6 h-4 w-[290px] rounded-[50%] bg-slate-100" />
    </div>
  );
}
