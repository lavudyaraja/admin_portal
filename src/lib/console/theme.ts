/**
 * The admin console's pastel palette, as data.
 *
 * Tailwind can't build class names at runtime (`bg-tint-${x}` is never seen by
 * the compiler and gets stripped), so anything that picks a tint dynamically —
 * stat tiles, status chips, chart series — reads the literal classes from here.
 */
export type TintName =
  | "gray" | "sky" | "mint" | "gold" | "blush" | "lavender"
  | "aqua" | "peach" | "lime" | "ice" | "cream" | "violet";

export interface Tint {
  /** Pastel surface fill. */
  bg: string;
  /** Saturated partner for the icon square / chart mark. */
  ink: string;
  /** Hex of `ink`, for SVG fills and inline styles. */
  hex: string;
}

export const TINT: Record<TintName, Tint> = {
  gray:     { bg: "bg-tint-gray",     ink: "text-ink-gray",     hex: "#64748b" },
  sky:      { bg: "bg-tint-sky",      ink: "text-ink-sky",      hex: "#0284c7" },
  mint:     { bg: "bg-tint-mint",     ink: "text-ink-mint",     hex: "#059669" },
  gold:     { bg: "bg-tint-gold",     ink: "text-ink-gold",     hex: "#b45309" },
  blush:    { bg: "bg-tint-blush",    ink: "text-ink-blush",    hex: "#be123c" },
  lavender: { bg: "bg-tint-lavender", ink: "text-ink-lavender", hex: "#7c3aed" },
  aqua:     { bg: "bg-tint-aqua",     ink: "text-ink-aqua",     hex: "#0d9488" },
  peach:    { bg: "bg-tint-peach",    ink: "text-ink-peach",    hex: "#ea580c" },
  lime:     { bg: "bg-tint-lime",     ink: "text-ink-lime",     hex: "#4d7c0f" },
  ice:      { bg: "bg-tint-ice",      ink: "text-ink-ice",      hex: "#0369a1" },
  cream:    { bg: "bg-tint-cream",    ink: "text-ink-cream",    hex: "#a16207" },
  violet:   { bg: "bg-tint-violet",   ink: "text-ink-violet",   hex: "#6d28d9" },
};

/**
 * Fixed categorical order for chart series. Assign from the front and never
 * cycle — a series keeps its hue when a filter changes the series count.
 *
 * This exact order is validated (lightness band, chroma floor, adjacent-pair
 * CVD separation, contrast vs. surface). The order is load-bearing: sky→mint→
 * violet→peach puts gold and peach apart, which at ΔE 9.3 under protan they
 * need to be. Re-validate before reordering or extending.
 */
export const CHART_SERIES: TintName[] = ["sky", "peach", "mint", "violet", "gold", "aqua"];

/** Single hue for magnitude-only charts (revenue over time, top printers). */
export const SEQUENTIAL_HEX = "#0284c7";
