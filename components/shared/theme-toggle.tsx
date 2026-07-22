"use client";

import { useTheme } from "next-themes";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/ui/button";
import { Moon, Sun, Monitor } from "lucide-react";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const options = [
    { value: "light", label: t("common.themeLight"), icon: Sun },
    { value: "dark", label: t("common.themeDark"), icon: Moon },
    { value: "system", label: t("common.themeSystem"), icon: Monitor },
  ] as const;

  if (compact) {
    return (
      <div className="flex gap-1">
        {options.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant={theme === value ? "default" : "ghost"}
            size="icon-sm"
            onClick={() => setTheme(value)}
            aria-label={label}
          >
            <Icon className="size-4" />
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{t("common.theme")}</p>
      <div className="flex gap-2">
        {options.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant={theme === value ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme(value)}
          >
            <Icon className="size-4" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
