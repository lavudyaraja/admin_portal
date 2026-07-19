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

/**
 * Prinsta Points → "1,234 pts".
 *
 * Points are their own unit, not money — formatting a balance with `inr()`
 * both shows the wrong symbol and divides by 100.
 */
export function points(n: number | null | undefined): string {
  return count(n ?? 0) + " pts";
}

/** 1 point = 10 paise. Mirrors PAISE_PER_POINT on the server. */
export const PAISE_PER_POINT = 10;

/**
 * Reads a points-ledger figure that may be stored in either unit.
 *
 * The ledger is split down the middle by the Wallet→Points rename: rows written
 * before it carry `amountPaise` with points left at 0, rows written after carry
 * `amountPoints` with paise left at 0. Reading either column alone renders half
 * the table as zero and quietly drops that half from any total — so read the
 * points column, and fall back to converting the legacy paise.
 */
export function ledgerPoints(row: { amountPoints?: number; amountPaise?: number }): number;
export function ledgerPoints(points: number | undefined, paise: number | undefined): number;
export function ledgerPoints(
  a: { amountPoints?: number; amountPaise?: number } | number | undefined,
  b?: number,
): number {
  const pts = typeof a === "object" ? a?.amountPoints : a;
  const paise = typeof a === "object" ? a?.amountPaise : b;
  if (pts) return pts;
  return Math.round((paise ?? 0) / PAISE_PER_POINT);
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
