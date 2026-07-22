"use client";

import { useTranslation } from "@/hooks/use-translation";
import { useLocaleStore } from "@/stores/locale-store";
import { localeConfig, type Locale } from "@/config/i18n/types";
import { cn } from "@/lib/utils";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const select = (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      aria-label={t("common.language")}
      className={cn(
        "h-10 rounded-lg border border-input bg-background/50 px-3 text-sm",
        compact ? "h-8 w-auto" : "w-full",
      )}
    >
      {(Object.keys(localeConfig) as Locale[]).map((loc) => (
        <option key={loc} value={loc}>
          {localeConfig[loc].label}
        </option>
      ))}
    </select>
  );

  if (compact) return select;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{t("common.language")}</p>
      {select}
    </div>
  );
}
