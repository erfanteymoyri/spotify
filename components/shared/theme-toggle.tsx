"use client";

import { useTheme } from "next-themes";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/ui/button";
import { Moon, Sun, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{t("common.theme")}</p>
      <div className="flex gap-2">
        <Button
          variant={theme === "light" ? "default" : "outline"}
          size="sm"
          onClick={() => setTheme("light")}
        >
          <Sun className="size-4" />
          {t("common.themeLight")}
        </Button>
        <Button
          variant={theme === "dark" ? "default" : "outline"}
          size="sm"
          onClick={() => setTheme("dark")}
        >
          <Moon className="size-4" />
          {t("common.themeDark")}
        </Button>
        <Button
          variant={theme === "system" ? "default" : "outline"}
          size="sm"
          onClick={() => setTheme("system")}
        >
          <Monitor className="size-4" />
          {t("common.themeSystem")}
        </Button>
      </div>
    </div>
  );
}
