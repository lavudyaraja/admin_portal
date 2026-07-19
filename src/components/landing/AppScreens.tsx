"use client";

import { useState } from "react";
import { LuImage } from "react-icons/lu";

/*
 * The screens carry no captions on purpose — the section is the screenshots and
 * nothing else. `label` is still needed for the alt text and for the
 * placeholder shown before a screenshot has been added.
 */

/**
 * The six app screenshots.
 *
 * PLACEHOLDERS — drop the real exports at these paths in /public/app-screens/
 * and they appear with no code change. Until a file exists the frame renders a
 * labelled placeholder rather than a broken image, so the section is presentable
 * before the screenshots are ready.
 *
 * Portrait exports at 1170x2532 (or any 9:19.5 ratio) fit the frame exactly.
 */
export interface AppScreen {
  src: string;
  label: string;
}

export const APP_SCREENS: AppScreen[] = [
  { src: "/app-screens/01-home.png", label: "Home" },
  { src: "/app-screens/02-scan.png", label: "Scan" },
  { src: "/app-screens/03-upload.png", label: "Upload" },
  { src: "/app-screens/04-preview.png", label: "Preview" },
  { src: "/app-screens/05-payment.png", label: "Payment" },
  { src: "/app-screens/06-orders.png", label: "Orders" },
];

/**
 * A horizontal rail of phone frames.
 *
 * Scroll-snapped rather than wrapped into a grid: six portrait phones in a grid
 * either shrink past legibility or push the section metres tall, while a rail
 * keeps them at a readable size and makes the overflow the reader's to explore.
 *
 * `justify-start` until the row fits, then centred — six phones overflow on a
 * laptop but sit short of the container on a wide monitor, where a left-packed
 * row would read as misaligned.
 */
export default function AppScreens() {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 sm:-mx-6 sm:gap-6 sm:px-6 lg:-mx-8 lg:px-8">
      {APP_SCREENS.map((screen) => (
        <div key={screen.src} className="w-[200px] shrink-0 snap-center sm:w-[240px] lg:w-[280px]">
          <PhoneFrame screen={screen} />
        </div>
      ))}
    </div>
  );
}

function PhoneFrame({ screen }: { screen: AppScreen }) {
  // A screenshot that has not been added yet 404s; swap to the placeholder
  // rather than leaving the browser's broken-image glyph in the frame.
  const [missing, setMissing] = useState(false);

  return (
    <div className="rounded-[1.75rem] bg-slate-900 p-2 shadow-xl ring-1 ring-white/10">
      <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.35rem] bg-slate-800">
        {/* Dynamic island, drawn over whatever fills the frame. */}
        <span className="absolute left-1/2 top-1.5 z-10 h-3 w-12 sm:h-3.5 sm:w-16 -translate-x-1/2 rounded-full bg-slate-950/90" />

        {missing ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-3 text-center">
            <LuImage size={22} className="text-slate-600" />
            <span className="text-[11px] font-bold text-slate-500">{screen.label}</span>
            <span className="text-[9px] leading-tight text-slate-600">Screenshot coming soon</span>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={screen.src}
            alt={`Prinsta app — ${screen.label} screen`}
            loading="lazy"
            onError={() => setMissing(true)}
            className="h-full w-full object-cover"
          />
        )}
      </div>
    </div>
  );
}
