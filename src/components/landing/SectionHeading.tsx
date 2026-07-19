import type { ReactNode } from "react";

/**
 * Shared section header — an eyebrow label, a bold title and an optional
 * subtitle, centered. Keeps every section's typography consistent.
 */
export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
}) {
  const alignment = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`max-w-2xl ${alignment} mb-14`}>
      {eyebrow && (
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-rose-600 mb-3">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-slate-500 text-sm sm:text-base mt-4 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
