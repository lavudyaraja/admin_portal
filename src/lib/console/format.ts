// Shared formatting helpers for the Prinsta consoles — shared by the vendor and admin portals.

/** Paise (₹×100) → "₹1,234" (no decimals). */
export function inr(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

/** Paise → "₹12.34" (two decimals). */
export function inr2(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Paise → "₹1.2L" / "₹34.5K" — for stat tiles, where the full figure won't fit. */
export function inrCompact(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 1e7) return "₹" + (rupees / 1e7).toFixed(1) + "Cr";
  if (rupees >= 1e5) return "₹" + (rupees / 1e5).toFixed(1) + "L";
  if (rupees >= 1e3) return "₹" + (rupees / 1e3).toFixed(1) + "K";
  return "₹" + rupees.toFixed(0);
}

/** 12345 → "12,345". */
export function count(n: number): string {
  return n.toLocaleString("en-IN");
}

/** ISO string → "12 Jul 2026, 3:04 PM". */
export function dateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

/** ISO string → "12 Jul 2026". */
export function dateOnly(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** "2026-07-12" → "12 Jul" — compact axis label for the revenue chart. */
export function axisDate(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
