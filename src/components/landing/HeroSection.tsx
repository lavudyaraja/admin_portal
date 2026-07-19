"use client";

import Link from "next/link";
import Image from "next/image";
import { LuDownload, LuArrowRight } from "react-icons/lu";

interface HeroSectionProps {
  /**
   * The signed-in console to send the reader to, or null when there is no
   * session — then the same button asks them to register instead.
   */
  dashboardHref: string | null;
}

/**
 * The hero is the studio render, shown whole.
 *
 * The artwork already carries the headline, the standfirst and a Download
 * button on its billboard, so nothing is overlaid on top of it — an overlay
 * would sit on copy that is already there and read as duplicated.
 *
 * Two things are NOT in the image, and both are deliberate:
 *
 *  - The buttons underneath. The billboard's "Download Prinsta App" is pixels,
 *    not a control; a hero with no clickable call to action is a dead end.
 *  - The heading above it on small screens. The render is 1024px wide and its
 *    baked-in headline lands around 5px tall on a phone — unreadable, and
 *    invisible to search engines and screen readers. The `sm:hidden` block
 *    restates it as real text on the sizes where the image can't carry it, and
 *    disappears the moment the image is legible.
 *
 * `alt` carries the billboard's wording for the same reason.
 *
 * /hero_section.png is 1536x1024, which covers the ~1216px this section renders
 * at on desktop, so it is no longer width-capped. It is still short of the
 * 2432px a 2x display would want; if it looks soft on a retina screen the fix
 * is a ~2560px export, not a code change.
 */
export default function HeroSection({ dashboardHref }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-[#FDF6F7] pt-32 sm:pt-40 lg:pt-44 pb-16 sm:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Small screens only — the render's own headline is too small to read here. */}
        <div className="sm:hidden mb-6 text-center">
          <h1 className="text-4xl font-black tracking-tight leading-[1.05]">
            <span className="text-slate-950">Print what you need.</span>
            <br />
            <span className="text-rose-600">Where you need it.</span>
          </h1>
          <p className="mt-3 text-slate-500 leading-relaxed">
            Upload your documents, pay securely, and print at any nearby printer in just a few taps.
          </p>
        </div>

        {/*
          The frame is the animated gradient itself.

          `.gradient-frame` (globals.css) paints a flowing multi-hue gradient as
          this element's background; the padding is what shows through as the
          ring, so the band thickness is the padding value and nothing else.

          The inner radius is deliberately smaller than the outer by roughly the
          ring width — concentric corners look wrong when both radii match.
        */}
        <div className="gradient-frame relative mx-auto rounded-[1.4rem] sm:rounded-[1.9rem] p-1.5 sm:p-2 shadow-2xl shadow-rose-900/15">
          <div className="overflow-hidden rounded-[1.05rem] sm:rounded-[1.5rem] bg-white">
            <Image
              src="/hero_section.png"
              alt="Print what you need. Where you need it. Upload your documents, pay securely, and print at any nearby printer in just a few taps."
              width={1536}
              height={1024}
              priority
              sizes="(max-width: 1280px) 100vw, 1216px"
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* The billboard's button is part of the artwork; these are the real ones. */}
        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/#download"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 px-7 py-3.5 text-sm font-bold text-white transition-colors active:scale-[0.98]"
          >
            <LuDownload size={16} />
            Download Prinsta App
          </Link>

          <Link
            href={dashboardHref ?? "/vendor/register?role=vendor"}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 px-7 py-3.5 text-sm font-bold text-rose-700 transition-colors"
          >
            {dashboardHref ? "Go to your console" : "Register your printer"}
            <LuArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
