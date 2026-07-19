"use client";

import { useReveal } from "./useReveal";
import NeuralWaves from "./NeuralWaves";
import AppScreens from "./AppScreens";

/**
 * The mobile-app section.
 *
 * Dark, unlike every other band on the page. That is the point: this is the one
 * section selling a separate product rather than the service, and the contrast
 * marks it as a different kind of pitch without inventing a new palette.
 *
 * It is the screenshots and nothing else. The section used to carry a copy
 * column — badge, headline, a five-step rail, guarantee chips — beside a mocked
 * phone, which restated the journey the How It Works band already walks through
 * and put a hand-built fake screen next to six real ones. The screens make the
 * same case on their own.
 */
export default function AppShowcase() {
  const { ref, seen } = useReveal<HTMLDivElement>();

  return (
    <section id="app" className="bg-slate-50 py-12 sm:py-16">
      <div className="relative max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 py-16 sm:py-24 shadow-2xl">
          {/* Behind the blobs, so their blur sits over the mesh and softens it into
              the background rather than competing with the screens. */}
          <NeuralWaves />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-24 top-10 h-[420px] w-[420px] rounded-full bg-rose-500/20 blur-3xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -left-32 bottom-0 h-[360px] w-[360px] rounded-full bg-violet-500/10 blur-3xl"
          />

          <div className="relative px-4 sm:px-6 lg:px-8">
            <div
              ref={ref}
              className={`reveal-group ${seen ? "is-visible" : ""}`}
            >
              <div className="reveal" style={{ "--i": 0 } as React.CSSProperties}>
                <AppScreens />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
