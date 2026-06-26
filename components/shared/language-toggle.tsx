"use client";

import { useTranslation } from "@/hooks/use-translation";
import { useLocaleStore } from "@/stores/locale-store";
import { localeConfig, type Locale } from "@/config/i18n/types";

export function LanguageToggle() {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{t("common.language")}</p>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="h-10 w-full rounded-lg border border-input bg-background/50 px-3 text-sm"
      >
        {(Object.keys(localeConfig) as Locale[]).map((loc) => (
          <option key={loc} value={loc}>
            {localeConfig[loc].label}
          </option>
        ))}
      </select>
    </div>
  );
}
