"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  PALETTE_VARIABLES,
  derivePalette,
  hexToOklch,
  type ThemeMode,
} from "@/lib/color";
import { extractCoverColor } from "@/lib/cover-color";
import { usePreferences } from "@/providers/preferences-provider";
import { usePlayerStore } from "@/stores/player-store";

/**
 * Applies the active theme colour to the document.
 *
 * Two modes, and the stored value decides which: a `#rrggbb` in
 * `backgroundColor` is a manual choice, an empty string means "follow the
 * artwork" and the colour is extracted from the cover of whatever is playing.
 *
 * It writes CSS custom properties on `<html>` and nothing else. That is what
 * keeps the feature from touching a hundred components: the progress bar is
 * already `var(--primary)`, the active toggles are already `text-primary`, the
 * page is already `bg-background` — re-pointing the variables re-colours all of
 * them at once, and removing them puts the designed theme back exactly.
 */
export function DynamicThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const { settings } = usePreferences();
  const coverUrl = usePlayerStore((s) => s.currentTrack?.coverUrl ?? null);

  /**
   * The extraction result, tagged with the cover it came from.
   *
   * Storing the source alongside the colour means a stale result is simply not
   * matched on the next render, instead of having to be cleared by an effect
   * — and a skip to a cover with no usable colour cannot leave the previous
   * track's palette on screen.
   */
  const [extracted, setExtracted] = useState<{
    src: string;
    color: string | null;
  } | null>(null);

  const manualColor = settings.backgroundColor;
  const isAuto = manualColor === "";

  useEffect(() => {
    if (!isAuto || !coverUrl) return;

    let cancelled = false;
    // Async because it decodes an image, so a fast skip through a playlist can
    // resolve out of order; only the newest result may land.
    void extractCoverColor(coverUrl).then((color) => {
      if (!cancelled) setExtracted({ src: coverUrl, color });
    });

    return () => {
      cancelled = true;
    };
  }, [coverUrl, isAuto]);

  const coverColor = extracted?.src === coverUrl ? extracted.color : null;
  const activeColor = isAuto ? coverColor : manualColor;

  useEffect(() => {
    const root = document.documentElement;
    // `resolvedTheme` is undefined until next-themes reads the stored choice.
    // Deriving against the wrong mode first would flash a light palette on a
    // dark page, so wait one render for it.
    const base = resolvedTheme && activeColor ? hexToOklch(activeColor) : null;

    if (!base) {
      clearPalette(root);
      return;
    }

    const mode: ThemeMode = resolvedTheme === "light" ? "light" : "dark";
    for (const [variable, value] of Object.entries(derivePalette(base, mode))) {
      root.style.setProperty(variable, value);
    }
    // The extracted colour itself, unadjusted, for the decorative glows —
    // everything else is lightness-corrected, and something on screen should
    // be the actual colour of the sleeve.
    root.style.setProperty("--cover-accent", activeColor);

    return () => clearPalette(root);
  }, [activeColor, resolvedTheme]);

  return <>{children}</>;
}

function clearPalette(root: HTMLElement) {
  for (const variable of PALETTE_VARIABLES) {
    root.style.removeProperty(variable);
  }
}
