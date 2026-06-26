"use client";

import { useEffect } from "react";
import { useLocaleStore } from "@/stores/locale-store";
import { localeConfig } from "@/config/i18n/types";

/** Syncs html lang and dir with the active locale. */
export function LocaleSync() {
  const locale = useLocaleStore((s) => s.locale);

  useEffect(() => {
    const { dir } = localeConfig[locale];
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale]);

  return null;
}
