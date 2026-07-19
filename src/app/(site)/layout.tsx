import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Assistant from "@/components/landing/Assistant";

/**
 * Shell for every public page — the landing page and the content pages both
 * live in this group, so the nav and footer are mounted once here rather than
 * per page.
 *
 * `overflow-x-clip` is a backstop, not the fix: the decorative art in the hero
 * and footer is built on fixed-width stages, and a single mispositioned
 * absolute child inside one of those would otherwise give the whole phone a
 * sideways scroll. Sections are still expected to fit on their own.
 *
 * It must be `clip` and not `hidden`. `hidden` makes this element a scroll
 * container, and `position: sticky` resolves against its nearest scrolling
 * ancestor — so every sticky descendant silently stops sticking, which is what
 * broke the How It Works table. `clip` contains the same overflow without
 * becoming a scroll container.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-clip bg-slate-50 text-slate-900 font-sans selection:bg-rose-500 selection:text-white">
      <Navbar />
      <main>{children}</main>
      <Footer />
      {/* Mounted here rather than per page, so the assistant is reachable from
          every public page — including the ones a reader lands on with a
          question already in mind, like /pricing and /faq. */}
      <Assistant />
    </div>
  );
}
