"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

export interface Slide {
  src: string;
  alt: string;
  /** Optional caption drawn over the bottom of the slide. */
  caption?: string;
}

/**
 * The image carousel used for the kiosk showcase.
 *
 * Built on a scroll container rather than transforms: the slides are real
 * scrollable children with `snap-center`, so a touch drag is the browser's own
 * native scroll — momentum, rubber-banding and all — and the arrows and dots are
 * just `scrollTo` calls on top of it. A transform-based track would have to
 * reimplement all of that in JS to feel right on a phone.
 *
 * Which slide is "current" is therefore read back OUT of the scroll position
 * rather than held as the source of truth, which keeps the dots honest when the
 * reader swipes instead of clicking.
 */
export default function Carousel({
  slides,
  interval = 5000,
  className = "",
}: {
  slides: Slide[];
  /** Autoplay period in ms; 0 disables autoplay. */
  interval?: number;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const scrollTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const target = track.children[i] as HTMLElement | undefined;
    if (target) track.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
  }, []);

  const go = useCallback(
    (delta: number) => scrollTo((index + delta + slides.length) % slides.length),
    [index, slides.length, scrollTo]
  );

  // Read the active slide back out of the scroll position, so a swipe moves the
  // dots too. rAF-throttled — scroll fires far more often than we need it.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const width = track.clientWidth || 1;
        setIndex(Math.round(track.scrollLeft / width));
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Autoplay. Paused on hover and on focus within, so it never slides out from
  // under someone reading a caption or tabbing through the dots.
  useEffect(() => {
    if (!interval || paused || slides.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % slides.length;
        scrollTo(next);
        return i; // the scroll handler owns the real update
      });
    }, interval);
    return () => clearInterval(id);
  }, [interval, paused, slides.length, scrollTo]);

  if (slides.length === 0) return null;

  return (
    <div
      className={`group relative ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Prinsta kiosks"
    >
      <div
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-3xl border border-slate-200/70 bg-slate-100"
      >
        {slides.map((s, i) => (
          <figure
            key={s.src + i}
            className="relative w-full shrink-0 snap-center"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.src}
              alt={s.alt}
              loading={i === 0 ? "eager" : "lazy"}
              className="aspect-[16/10] w-full object-cover"
            />
            {s.caption && (
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 to-transparent px-5 py-4 text-sm font-semibold text-white sm:px-7 sm:py-6 sm:text-base">
                {s.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          {/* Arrows. Hidden from touch, where the swipe is the control and two
              floating buttons would just cover the image. */}
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg backdrop-blur transition hover:bg-white focus-visible:opacity-100 sm:flex sm:opacity-0 sm:group-hover:opacity-100"
          >
            <LuChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg backdrop-blur transition hover:bg-white focus-visible:opacity-100 sm:flex sm:opacity-0 sm:group-hover:opacity-100"
          >
            <LuChevronRight size={18} />
          </button>

          <div className="mt-4 flex items-center justify-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.src + i}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-6 bg-rose-500" : "w-2 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
