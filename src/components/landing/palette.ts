/**
 * Landing-page colour system.
 *
 * The brand palette is twelve pastel tints, all around 97% lightness. They work
 * as SURFACES — icon chips, section bands, cards — and nothing else: at that
 * lightness none of them can carry text, a button, or a heading.
 *
 * So each tint is paired with a saturated sibling of the SAME hue for the glyph
 * that sits on it, and one of those hues (violet, which appears twice in the
 * brand tints as `lavender` and `violet`) is promoted to PRIMARY. Primary owns
 * every call to action, link, and accent word, which is what keeps the page
 * reading as one system rather than a spread of unrelated pastels.
 *
 * The glyph colours are validated for contrast against a light surface and for
 * colour-vision separation — re-run the check before adding to this list.
 */

/** Brand tints — surfaces only, never text. */
export const TINT = {
  gray: "#F5F7FA",
  sky: "#EAF6FF",
  mint: "#F0FFF4",
  gold: "#FFF7E8",
  blush: "#FFF0F5",
  lavender: "#F5F0FF",
  aqua: "#EFFFFA",
  peach: "#FFF4F0",
  lime: "#F3FFF0",
  ice: "#EEF7FF",
  cream: "#FFFBEA",
  violet: "#F8F4FF",
} as const;

/** Saturated partner for the glyph that sits on each tint. */
export const GLYPH = {
  violet: "text-violet-600",
  sky: "text-sky-600",
  mint: "text-emerald-600",
  gold: "text-amber-700",
  blush: "text-rose-600",
  peach: "text-orange-600",
  ice: "text-sky-700",
  aqua: "text-teal-600",
} as const;

/** The one accent hue. Everything interactive wears this. */
export const PRIMARY = {
  /** Solid fill — buttons. */
  bg: "bg-violet-600 hover:bg-violet-700",
  /** Accent text — headline words, links. */
  text: "text-violet-600",
  /** Tinted surface in the primary hue. */
  surface: TINT.lavender,
  /** Border on primary-tinted elements. */
  border: "border-violet-200",
  ring: "ring-violet-200",
  hex: "#7C3AED",
} as const;

/** Page background. */
export const SURFACE = TINT.gray;

/** Body copy. Deep navy-slate rather than black. */
export const INK = {
  heading: "text-slate-800",
  body: "text-slate-500",
  muted: "text-slate-400",
} as const;
