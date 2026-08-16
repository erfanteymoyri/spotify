/**
 * Reading the dominant colour out of a cover image.
 *
 * Color Thief does the quantisation; the judgement calls are here.
 *
 * Two of them matter. First, the *dominant* colour of an album cover is very
 * often its background — which for a great many sleeves is black, white or
 * grey, and carries no theme at all. So when the dominant colour turns out to
 * be achromatic we fall back to the most vivid swatch, which is what a person
 * would have picked by eye. Second, reading pixels means a canvas, and a
 * canvas fed a cross-origin image without CORS headers is tainted: it throws
 * rather than returning a colour. The object store is configured to send those
 * headers (see `MINIO_API_CORS_ALLOW_ORIGIN` in docker-compose), the image is
 * requested with `crossOrigin`, and a failure is answered with `null` — the
 * caller then simply keeps the default theme.
 */

import { hexToOklch, isUsableThemeColor } from "@/lib/color";

/**
 * Color Thief is loaded on first use, not with the app.
 *
 * `DynamicThemeProvider` sits in the root layout, so a static import would put
 * the quantiser in the entry bundle of every route — parsed before first paint
 * on a page that may never play anything. Nothing needs it until a cover is on
 * screen, and by then the app is interactive.
 */
let colorThief: Promise<typeof import("colorthief")> | null = null;
function loadColorThief() {
  colorThief ??= import("colorthief");
  return colorThief;
}

/**
 * Extraction costs a decode plus a quantisation pass, and a listener cycling
 * back through a playlist asks for the same covers over and over.
 */
const cache = new Map<string, string | null>();

/** Swatches worth theming with, best first. */
const SWATCH_ORDER = ["Vibrant", "DarkVibrant", "LightVibrant", "Muted"] as const;

export async function extractCoverColor(src: string): Promise<string | null> {
  if (!src) return null;

  const cached = cache.get(src);
  if (cached !== undefined) return cached;

  const color = await extract(src);
  cache.set(src, color);
  return color;
}

async function extract(src: string): Promise<string | null> {
  let image: HTMLImageElement;
  let getColorSync: typeof import("colorthief").getColorSync;
  let getSwatchesSync: typeof import("colorthief").getSwatchesSync;
  try {
    [image, { getColorSync, getSwatchesSync }] = await Promise.all([
      loadImage(src),
      loadColorThief(),
    ]);
  } catch {
    return null;
  }

  try {
    const dominant = getColorSync(image, {
      // A tenth of the pixels is plenty for a 640px sleeve and keeps the pass
      // off the frame budget.
      quality: 10,
      // Sleeves are routinely matted on white or black; sampling those would
      // return the mat rather than the artwork.
      ignoreWhite: true,
    });

    if (dominant) {
      const parsed = hexToOklch(dominant.hex());
      if (parsed && isUsableThemeColor(parsed)) return dominant.hex();
    }

    // The dominant colour was grey. Ask for the vivid one instead.
    const swatches = getSwatchesSync(image);
    for (const role of SWATCH_ORDER) {
      const swatch = swatches[role];
      if (!swatch) continue;
      const parsed = hexToOklch(swatch.color.hex());
      if (parsed && isUsableThemeColor(parsed)) return swatch.color.hex();
    }

    // Genuinely monochrome artwork. Saying so lets the caller keep the
    // designed theme instead of repainting it in a colour nobody can see.
    return null;
  } catch {
    // A tainted canvas, or an image the decoder refused.
    return null;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // Must be set before `src`, or the request goes out without the header and
    // the canvas is tainted regardless of what the server would have allowed.
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`could not load ${src}`));
    image.src = src;
  });
}
