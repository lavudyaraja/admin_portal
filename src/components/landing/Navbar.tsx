"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { LuMenu, LuX, LuDownload } from "react-icons/lu";
import RoleMenu, { RoleLinks } from "./RoleMenu";

/**
 * One source of truth for both the desktop rail and the mobile drawer.
 *
 * `section` is the id this item watches on the landing page. Items without one
 * are their own route and are matched on pathname instead.
 */
const NAV: { label: string; href: string; section?: string }[] = [
  { label: "Features", href: "/#features", section: "features" },
  { label: "Why Prinsta", href: "/#why-prinsta", section: "why-prinsta" },
  { label: "App", href: "/#app", section: "app" },
  { label: "How It Works", href: "/#how-it-works", section: "how-it-works" },
  { label: "FAQ", href: "/#faq", section: "faq" },
];

/**
 * The landing nav.
 *
 * Two things make it more than a row of links, and both are driven by where the
 * reader actually is rather than by hover:
 *
 *  - A single white pill slides between items. It is one absolutely-positioned
 *    element whose offset/width are measured from the active link, so the travel
 *    is a real transition rather than six elements cross-fading.
 *  - Which item is active comes from an IntersectionObserver over the landing
 *    sections, so scrolling the page moves the pill. Off the landing page there
 *    are no sections to watch and it falls back to matching the pathname.
 */
export default function Navbar() {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  const railRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // ── Route-based active state, for the pages that are their own route ──
  useEffect(() => {
    if (isLanding) return;
    setActiveIdx(NAV.findIndex((n) => !n.section && n.href === pathname));
  }, [pathname, isLanding]);

  // ── Condensed state ──
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setScrolled(window.scrollY > 20);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // ── Scroll spy over the landing sections ──
  useEffect(() => {
    if (!isLanding) return;

    const watched = NAV.map((n, i) => ({ i, el: n.section && document.getElementById(n.section) }))
      .filter((x): x is { i: number; el: HTMLElement } => Boolean(x.el));
    if (watched.length === 0) return;

    // Track ratios rather than reacting to each entry: several sections are in
    // view at once mid-scroll, and the active one is whichever covers most.
    const ratios = new Map<Element, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) ratios.set(e.target, e.isIntersecting ? e.intersectionRatio : 0);

        let best = -1;
        let bestRatio = 0;
        for (const { i, el } of watched) {
          const r = ratios.get(el) ?? 0;
          if (r > bestRatio) {
            bestRatio = r;
            best = i;
          }
        }
        // At the very top nothing is "current" — the hero isn't a nav item.
        setActiveIdx(window.scrollY < 200 ? -1 : best);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: "-72px 0px -40% 0px" }
    );

    watched.forEach(({ el }) => observer.observe(el));
    return () => observer.disconnect();
  }, [isLanding]);

  // ── Measure the pill against the active link ──
  const measure = useCallback(() => {
    const rail = railRef.current;
    const el = activeIdx >= 0 ? itemRefs.current[activeIdx] : null;
    if (!rail || !el) {
      setPill(null);
      return;
    }
    const r = rail.getBoundingClientRect();
    const t = el.getBoundingClientRect();
    setPill({ left: t.left - r.left, width: t.width });
  }, [activeIdx]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  // Close the drawer on navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // While the drawer is open it owns the screen: freeze the page behind it so
  // scrolling the drawer doesn't drag the landing page along underneath, and
  // let Escape close it.
  useEffect(() => {
    if (!mobileOpen) return;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  return (
    <nav
      className={`fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)] transition-all duration-300 ease-out ${
        scrolled ? "top-2 max-w-6xl" : "top-4 sm:top-6 max-w-2xl lg:max-w-5xl"
      }`}
    >
      <div
        className={`relative rounded-2xl border bg-white/80 backdrop-blur-xl transition-shadow duration-300 ${
          scrolled ? "border-slate-200 shadow-lg shadow-slate-900/5" : "border-slate-200/80"
        }`}
      >
        <div className="px-3 sm:px-4 lg:px-5">
          <div
            className={`flex items-center justify-between gap-3 transition-all duration-300 ${
              scrolled ? "h-14" : "h-16"
            }`}
          >
            {/* ── Wordmark ── */}
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt=""
                aria-hidden
                className="w-8 h-8 rounded-lg shrink-0 object-contain transition-transform duration-200 group-hover:scale-105"
              />
              <span className="text-slate-950 font-black text-lg tracking-tight">Prinsta</span>
            </Link>

            {/* ── Rail ── */}
            <div
              ref={railRef}
              className="relative hidden lg:flex items-center gap-0.5 rounded-xl bg-slate-100/70 p-1"
            >
              {/* The sliding indicator. Rendered only once measured, so it never
                  animates in from the left edge on first paint. */}
              {pill && (
                <span
                  aria-hidden
                  className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm transition-all duration-300 ease-out"
                  style={{ left: pill.left, width: pill.width }}
                />
              )}

              {NAV.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  className={`relative z-10 rounded-lg px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                    activeIdx === i
                      ? "text-rose-600"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* ── Actions ── */}
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              <RoleMenu mode="login" variant="ghost" />
              <Link
                href="/#download"
                className="inline-flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition-colors active:scale-[0.98]"
              >
                Download App
                <LuDownload size={15} />
              </Link>
            </div>

            {/* ── Mobile toggle ── */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="flex lg:hidden w-10 h-10 items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              {mobileOpen ? <LuX size={21} /> : <LuMenu size={21} />}
            </button>
          </div>
        </div>

      </div>

      {/* ── Mobile drawer ── */}
      {/* Tap-anywhere-else to dismiss. Sits behind the drawer but above the
          page, and is only rendered while open. */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 -z-10 cursor-default bg-slate-950/20 backdrop-blur-[2px]"
        />
      )}
      {mobileOpen && (
        // The drawer is taller than a phone screen once the role links are in,
        // and its parent is `fixed` — so without a viewport-bounded height and
        // its own scroll the last entries simply fell off the bottom with no
        // way to reach them. `dvh` rather than `vh` so the mobile browser's
        // collapsing address bar doesn't hide the end of the list either.
        <div className="lg:hidden mt-2 max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-xl px-3 py-3">
          <div className="space-y-1">
            {NAV.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-colors ${
                  activeIdx === i
                    ? "bg-rose-50 text-rose-600"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {item.label}
                {activeIdx === i && (
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden />
                )}
              </Link>
            ))}
          </div>

          <Link
            href="/#download"
            onClick={() => setMobileOpen(false)}
            className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 px-4 py-3 text-sm font-bold text-white transition-colors"
          >
            Download App
            <LuDownload size={15} />
          </Link>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
            <RoleLinks mode="login" onNavigate={() => setMobileOpen(false)} />
            <RoleLinks mode="register" onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </nav>
  );
}
