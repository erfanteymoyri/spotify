"use client";

import { useLocaleStore } from "@/stores/locale-store";
import { translate } from "@/config/i18n";

export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);

  function t(key: string, params?: Record<string, string | number>) {
    return translate(locale, key, params);
  }

  return { t, locale };
}
