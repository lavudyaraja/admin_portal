"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fires once when the element first scrolls into view.
 *
 * Returns a ref to attach and whether it has been seen. Deliberately one-shot:
 * the observer disconnects on the first hit, so sections don't re-animate every
 * time they scroll back past — which reads as a glitch rather than an effect.
 *
 * Pair with `.reveal-group` / `.reveal` in globals.css.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Without IntersectionObserver, show the content rather than hide it.
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, seen };
}
