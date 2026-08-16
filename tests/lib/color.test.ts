import { describe, expect, it } from "vitest";
import {
  PALETTE_VARIABLES,
  derivePalette,
  hexToOklch,
  isHexColor,
  isUsableThemeColor,
  oklchToCss,
  rgbToOklch,
} from "@/lib/color";

/** Pull the three numbers back out of an `oklch(l c h)` string. */
function parse(css: string): { l: number; c: number; h: number } {
  const match = css.match(/oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/);
  if (!match) throw new Error(`not an oklch string: ${css}`);
  return { l: Number(match[1]), c: Number(match[2]), h: Number(match[3]) };
}

describe("isHexColor", () => {
  it("accepts #rrggbb and nothing else", () => {
    expect(isHexColor("#1db954")).toBe(true);
    expect(isHexColor("#1DB954")).toBe(true);

    // The value ends up inside a stylesheet, so the shorthand and every
    // looser form stay out.
    expect(isHexColor("#fff")).toBe(false);
    expect(isHexColor("red")).toBe(false);
    expect(isHexColor("#1db954; --x: y")).toBe(false);
  });
});

describe("rgbToOklch", () => {
  it("puts black and white at the ends of the lightness range", () => {
    expect(rgbToOklch(0, 0, 0).l).toBeCloseTo(0, 3);
    expect(rgbToOklch(255, 255, 255).l).toBeCloseTo(1, 3);
  });

  it("reports greys as having no chroma", () => {
    expect(rgbToOklch(128, 128, 128).c).toBeCloseTo(0, 4);
  });

  it("places the primaries at their known hue angles", () => {
    expect(rgbToOklch(255, 0, 0).h).toBeCloseTo(29.23, 1);
    expect(rgbToOklch(0, 255, 0).h).toBeCloseTo(142.5, 1);
    expect(rgbToOklch(0, 0, 255).h).toBeCloseTo(264.05, 1);
  });

  it("decodes the sRGB transfer curve", () => {
    // Mid-grey is ~0.6 perceptual lightness. Skipping the gamma decode would
    // put it near 0.5 and make every derived palette muddy.
    expect(rgbToOklch(128, 128, 128).l).toBeGreaterThan(0.55);
    expect(rgbToOklch(128, 128, 128).l).toBeLessThan(0.65);
  });
});

describe("hexToOklch", () => {
  it("agrees with the rgb path", () => {
    expect(hexToOklch("#1db954")).toEqual(rgbToOklch(0x1d, 0xb9, 0x54));
  });

  it("returns null for anything that is not a colour", () => {
    expect(hexToOklch("nonsense")).toBeNull();
  });
});

describe("derivePalette", () => {
  const vivid = rgbToOklch(0xe8, 0x5d, 0x75); // a bright pink sleeve

  it("only sets variables it knows how to clear again", () => {
    const palette = derivePalette(vivid, "dark");
    for (const variable of Object.keys(palette)) {
      expect(PALETTE_VARIABLES).toContain(variable);
    }
  });

  it("keeps the hue of the source colour", () => {
    for (const mode of ["dark", "light"] as const) {
      const primary = parse(derivePalette(vivid, mode)["--primary"]);
      expect(primary.h).toBeCloseTo(vivid.h, 1);
    }
  });

  it("pins lightness to the design system's value, not the artwork's", () => {
    // The whole point: a near-black cover and a near-white one must both
    // produce a readable accent, so L comes from the role and never from the
    // colour that arrived.
    const dark = rgbToOklch(0x0a, 0x14, 0x0a);
    const light = rgbToOklch(0xf2, 0xf7, 0xd0);

    for (const source of [dark, light]) {
      expect(parse(derivePalette(source, "dark")["--primary"]).l).toBeCloseTo(0.72, 5);
      expect(parse(derivePalette(source, "light")["--primary"]).l).toBeCloseTo(0.55, 5);
    }
  });

  it("keeps the page far from the accent it has to show", () => {
    for (const mode of ["dark", "light"] as const) {
      const palette = derivePalette(vivid, mode);
      const background = parse(palette["--background"]);
      const primary = parse(palette["--primary"]);
      expect(Math.abs(background.l - primary.l)).toBeGreaterThan(0.35);
    }
  });

  it("never lets a surface take on more chroma than its role allows", () => {
    const neon = { l: 0.7, c: 0.37, h: 320 };
    const background = parse(derivePalette(neon, "dark")["--background"]);
    expect(background.c).toBeLessThanOrEqual(0.028);
  });

  it("leaves a muted colour muted", () => {
    // The ceiling is a cap, not a target: a restrained sleeve must not be
    // pumped up to full saturation.
    const muted = { l: 0.5, c: 0.04, h: 200 };
    expect(parse(derivePalette(muted, "dark")["--primary"]).c).toBeCloseTo(0.04, 4);
  });

  it("dresses the sidebar and focus rings in the same accent", () => {
    const palette = derivePalette(vivid, "dark");
    expect(palette["--ring"]).toBe(palette["--primary"]);
    expect(palette["--sidebar-primary"]).toBe(palette["--primary"]);
    expect(palette["--chart-1"]).toBe(palette["--primary"]);
  });
});

describe("isUsableThemeColor", () => {
  it("rejects a colour with no hue to theme with", () => {
    // A black-and-white sleeve derives a palette indistinguishable from the
    // default, so the caller is told to keep the designed theme instead.
    expect(isUsableThemeColor(rgbToOklch(20, 20, 20))).toBe(false);
    expect(isUsableThemeColor(rgbToOklch(240, 240, 240))).toBe(false);
  });

  it("accepts anything with visible colour in it", () => {
    expect(isUsableThemeColor(rgbToOklch(0x1d, 0xb9, 0x54))).toBe(true);
  });
});

describe("oklchToCss", () => {
  it("emits a css colour rounded to what a stylesheet needs", () => {
    expect(oklchToCss({ l: 0.723456789, c: 0.19123456, h: 145.6789 })).toBe(
      "oklch(0.7235 0.1912 145.68)",
    );
  });
});
