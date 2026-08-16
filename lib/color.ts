/**
 * Turning one colour into a theme.
 *
 * The naive version of "use the cover's dominant colour as the background"
 * paints the app in whatever the artwork happened to be — which for a dark
 * sleeve is near-black text on near-black, and for a bright one is unreadable
 * white-on-yellow. What actually reads as "themed by the artwork" is keeping
 * the *hue*, keeping as much of the chroma as the role can carry, and pinning
 * the *lightness* to the value the design system already uses for that role.
 *
 * OKLCH is what makes that a two-line rule instead of a pile of special cases:
 * its L is perceptual, so "L = 0.72" is equally light for yellow and for blue,
 * and contrast against the foreground holds no matter which hue arrives.
 *
 * Everything here is pure and framework-free — `DynamicThemeProvider` decides
 * *when* to apply a palette, this decides *what* it is.
 */

export interface Oklch {
  /** Perceptual lightness, 0–1. */
  l: number;
  /** Chroma. 0 is grey; ~0.37 is about as saturated as sRGB goes. */
  c: number;
  /** Hue angle in degrees, 0–360. */
  h: number;
}

/** A colour that is essentially grey; hue means nothing below this. */
const ACHROMATIC = 0.015;

export const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: string): boolean {
  return HEX_PATTERN.test(value);
}

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

/** `#rrggbb` to OKLCH, or `null` if it is not a hex colour. */
export function hexToOklch(hex: string): Oklch | null {
  if (!isHexColor(hex)) return null;
  const value = Number.parseInt(hex.slice(1), 16);
  return rgbToOklch(
    (value >> 16) & 0xff,
    (value >> 8) & 0xff,
    value & 0xff,
  );
}

/**
 * 8-bit sRGB to OKLCH, via Björn Ottosson's OKLab matrices.
 *
 * The gamma step first: sRGB stores light non-linearly, and skipping the
 * decode is the classic reason a "dominant colour" comes out muddy.
 */
export function rgbToOklch(r: number, g: number, b: number): Oklch {
  const lr = linearize(r / 255);
  const lg = linearize(g / 255);
  const lb = linearize(b / 255);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const okL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const okA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const okB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const chroma = Math.sqrt(okA * okA + okB * okB);
  const hue = chroma < 1e-6 ? 0 : ((Math.atan2(okB, okA) * 180) / Math.PI + 360) % 360;

  return { l: clamp(okL, 0, 1), c: chroma, h: hue };
}

function linearize(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

/** An `oklch(...)` string, rounded to what a stylesheet needs. */
export function oklchToCss({ l, c, h }: Oklch): string {
  return `oklch(${round(l, 4)} ${round(c, 4)} ${round(h, 2)})`;
}

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

export type ThemeMode = "light" | "dark";

/**
 * The role each variable plays, per mode.
 *
 * `l` is fixed — that is the whole point, and it is copied from the values
 * already in `globals.css`, so a derived theme sits at exactly the lightness
 * the hand-tuned one does. `maxC` is a ceiling, not a target: a muted sleeve
 * stays muted, while a vivid one is only prevented from turning a surface into
 * a highlighter.
 */
const ROLES = {
  dark: {
    primary: { l: 0.72, maxC: 0.19 },
    primaryForeground: { l: 0.14, maxC: 0.03 },
    background: { l: 0.13, maxC: 0.028 },
    card: { l: 0.185, maxC: 0.026 },
    sidebar: { l: 0.1, maxC: 0.026 },
    accent: { l: 0.26, maxC: 0.035 },
  },
  light: {
    primary: { l: 0.55, maxC: 0.17 },
    primaryForeground: { l: 0.99, maxC: 0.01 },
    background: { l: 0.975, maxC: 0.018 },
    card: { l: 1, maxC: 0.008 },
    sidebar: { l: 0.955, maxC: 0.016 },
    accent: { l: 0.92, maxC: 0.03 },
  },
} as const satisfies Record<ThemeMode, Record<string, { l: number; maxC: number }>>;

/**
 * The CSS custom properties a derived theme sets.
 *
 * Only these: the rest of the design system is built on them, so tinting
 * `--primary` re-colours the progress bar, the active toggles, the play button
 * and the focus rings at once — without any component knowing a theme colour
 * exists. `--cover-accent` is the odd one out: it is the extracted colour
 * *unmodified*, for the decorative glows that should show the real thing.
 */
export type Palette = Record<string, string>;

/**
 * Every variable a derived theme may set.
 *
 * Listed separately from `derivePalette` because removing a theme has to undo
 * exactly what applying one did: a provider that only cleared the keys of the
 * palette it happens to hold would strip nothing when there is no palette left
 * to look at.
 */
export const PALETTE_VARIABLES = [
  "--primary",
  "--primary-foreground",
  "--background",
  "--card",
  "--popover",
  "--accent",
  "--ring",
  "--chart-1",
  "--sidebar",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-ring",
  "--cover-accent",
] as const;

export function derivePalette(base: Oklch, mode: ThemeMode): Palette {
  const roles = ROLES[mode];
  const tone = (role: { l: number; maxC: number }): string =>
    oklchToCss({ l: role.l, c: Math.min(base.c, role.maxC), h: base.h });

  const primary = tone(roles.primary);

  return {
    "--primary": primary,
    "--primary-foreground": tone(roles.primaryForeground),
    "--background": tone(roles.background),
    "--card": tone(roles.card),
    "--popover": tone(roles.card),
    "--accent": tone(roles.accent),
    // Focus rings and the first chart series are the brand colour by
    // definition, so they follow it rather than being tinted separately.
    "--ring": primary,
    "--chart-1": primary,
    "--sidebar": tone(roles.sidebar),
    "--sidebar-primary": primary,
    "--sidebar-primary-foreground": tone(roles.primaryForeground),
    "--sidebar-ring": primary,
  };
}

/**
 * Reject a colour that cannot carry a theme.
 *
 * An extractor handed a black-and-white sleeve returns something honest but
 * useless: near-zero chroma derives a palette indistinguishable from the
 * default, so it is better to say so and leave the design system alone than to
 * repaint everything with a colour nobody can see.
 */
export function isUsableThemeColor(base: Oklch): boolean {
  return base.c >= ACHROMATIC;
}

// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
