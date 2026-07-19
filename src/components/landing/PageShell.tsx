import type { ReactNode } from "react";

/**
 * Header + prose body for the public content pages.
 *
 * Every page in the `(site)` group opens the same way — eyebrow, title,
 * standfirst — so the shell owns that block and the pages only supply copy.
 * `updated` renders only on the legal pages, where "when did this last change"
 * is part of the content rather than decoration.
 */
export default function PageShell({
  eyebrow,
  title,
  intro,
  updated,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  updated?: string;
  children?: ReactNode;
}) {
  return (
    <>
      <header className="pt-32 pb-14 bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block max-w-full text-balance rounded-full bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-rose-600">
            {eyebrow}
          </span>
          <h1 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950">
            {title}
          </h1>
          {intro && (
            <p className="mt-4 text-slate-500 text-base sm:text-lg leading-relaxed">{intro}</p>
          )}
          {updated && (
            <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Last updated · {updated}
            </p>
          )}
        </div>
      </header>

      {children}
    </>
  );
}

/** A titled block of body copy. Legal and company pages are built from these. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-black text-slate-900">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

/** Constrained column for the `Section` stack. */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}

/** Bulleted list in the body-copy style. */
export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
