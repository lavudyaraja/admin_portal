"use client";

import HeroSection from "@/components/landing/HeroSection";
import Features from "@/components/landing/Features";
import WhyChoose from "@/components/landing/WhyChoose";
import AppShowcase from "@/components/landing/AppShowcase";
import HowItWorks from "@/components/landing/HowItWorks";
import Security from "@/components/landing/Security";
import FAQ from "@/components/landing/FAQ";
import { useDashboardHref } from "@/lib/useActiveConsoles";

/**
 * The landing page — sections only.
 *
 * Navbar and Footer come from the `(site)` layout, which every public page
 * shares. They used to be mounted here as well, which meant two places to keep
 * in step whenever a nav link changed.
 */
export default function HomePage() {
  // null until the session store is read on the client — the hero shows its
  // signed-out call to action until then.
  const dashboardHref = useDashboardHref();

  return (
    <>
      <HeroSection dashboardHref={dashboardHref} />
      <Features />
      <WhyChoose />
      <AppShowcase />
      <HowItWorks />
      <Security />
      {/* The FAQ section has its own route (/faq) for anyone linking straight
          to it; the component carries its own heading and `#faq` anchor, so
          it mounts here unchanged. */}
      <FAQ />
    </>
  );
}
