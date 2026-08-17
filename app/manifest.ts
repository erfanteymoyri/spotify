import type { MetadataRoute } from "next";

/**
 * The web app manifest — what makes the app installable.
 *
 * Served at `/manifest.webmanifest` by Next's metadata convention, which also
 * emits the `<link rel="manifest">` in every document, so nothing has to be
 * wired into the layout by hand.
 *
 * Written as `.ts` rather than a static `.json` so the colours can be commented
 * back to their source: they are the dark theme's tokens from `globals.css`
 * resolved to hex, because a manifest may not contain `oklch()` or a CSS
 * variable and the two would otherwise drift apart silently.
 */

/** `--background` of the dark theme, `oklch(0.12 0.005 285)`. */
const BRAND_BACKGROUND = "#060607";

export default function manifest(): MetadataRoute.Manifest {
  return {
    // A stable identity, so a later change of `start_url` or `name` does not
    // read to the browser as a different app that must be installed again.
    id: "/",
    name: "Spotify — پخش موسیقی",
    short_name: "Spotify",
    description:
      "پخش آنلاین موسیقی، ساخت پلی‌لیست و دنبال کردن هنرمندان مورد علاقه‌تان.",

    lang: "fa",
    dir: "rtl",

    start_url: "/",
    // Everything the app serves lives under the root, and an explicit scope is
    // what tells the browser which navigations stay inside the installed
    // window rather than bouncing out to a browser tab.
    scope: "/",

    display: "standalone",
    background_color: BRAND_BACKGROUND,
    // Colours the OS window chrome. The app defaults to its dark theme, so the
    // dark background is the honest choice: a light bar above a dark app reads
    // as a rendering bug.
    theme_color: BRAND_BACKGROUND,

    // No orientation lock. The player is used both ways, and pinning it would
    // override a choice that belongs to the listener.

    icons: [
      // `any` icons are drawn as supplied, so they go edge to edge.
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // Maskable icons are cropped to the launcher's own shape — a circle, a
      // squircle — keeping roughly the middle 80%. These have the logo inset
      // inside that safe area on a filled background, so a crop removes
      // background instead of slicing the artwork.
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],

    // Long-press / right-click actions on the installed icon.
    shortcuts: [
      {
        name: "کتابخانه من",
        short_name: "کتابخانه",
        url: "/library",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "پلی‌لیست‌ها",
        short_name: "پلی‌لیست‌ها",
        url: "/playlists",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
