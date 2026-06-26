"use client";

import { useEffect, useState } from "react";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/ui/button";
import { Slider } from "@/ui/slider";
import { useTranslation } from "@/hooks/use-translation";
import { settingsService } from "@/services/notification.service";
import { mockSubscriptionPlans } from "@/lib/mock-data";
import type { UserSettings } from "@/types";

export default function SettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    settingsService.getSettings().then(setSettings);
  }, []);

  const update = async (patch: Partial<UserSettings>) => {
    const updated = await settingsService.updateSettings(patch);
    setSettings(updated);
  };

  if (!settings) {
    return (
      <p className="py-20 text-center text-muted-foreground">
        {t("common.loading")}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4">
      <SectionHeader title={t("settings.title")} />

      <section className="space-y-4 rounded-xl bg-card/40 p-6">
        <h3 className="font-semibold">{t("settings.notifications")}</h3>
        <label className="flex items-center justify-between">
          <span className="text-sm">{t("settings.notificationsEnabled")}</span>
          <input
            type="checkbox"
            checked={settings.notificationsEnabled}
            onChange={(e) =>
              update({ notificationsEnabled: e.target.checked })
            }
            className="size-4 accent-primary"
          />
        </label>
      </section>

      <section className="space-y-4 rounded-xl bg-card/40 p-6">
        <h3 className="font-semibold">{t("settings.defaultVolume")}</h3>
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={settings.volume}
          onChange={(e) => update({ volume: Number(e.target.value) })}
        />
      </section>

      <section className="space-y-4 rounded-xl bg-card/40 p-6">
        <ThemeToggle />
      </section>

      <section className="space-y-4 rounded-xl bg-card/40 p-6">
        <LanguageToggle />
      </section>

      <section className="space-y-4 rounded-xl bg-card/40 p-6">
        <h3 className="font-semibold">{t("settings.currentPlan")}</h3>
        <div className="grid gap-3">
          {mockSubscriptionPlans.map((plan) => (
            <div
              key={plan.tier}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div>
                <p className="font-medium">{plan.name}</p>
                <p className="text-sm text-muted-foreground">
                  {plan.price === 0
                    ? t("common.free")
                    : `${plan.price.toLocaleString()} ${t("subscription.toman")}`}
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                {t("settings.upgradePhase2")}
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h3 className="font-semibold text-destructive">
          {t("settings.deleteAccount")}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("settings.deleteAccountHint")}
        </p>
        <Button variant="destructive" className="mt-4" size="sm">
          {t("settings.deleteAccountButton")}
        </Button>
      </section>
    </div>
  );
}
