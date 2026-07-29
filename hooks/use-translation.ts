"use client";

import { useCallback } from "react";
import { useLocaleStore } from "@/stores/locale-store";
import { translate } from "@/config/i18n";

/**
 * `t` is memoised on the locale, so its identity only changes when the language
 * does. Returning a fresh function each render would make it unusable in an
 * effect's dependency array: the effect would re-run on *every* render, and any
 * effect that also sets state would loop.
 */
export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale],
  );

  return { t, locale };
}
