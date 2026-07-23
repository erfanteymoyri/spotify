"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { FadeIn } from "@/components/shared/motion";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { Dialog } from "@/ui/dialog";
import { Slider } from "@/ui/slider";
import { routes } from "@/config/site";
import { useTranslation } from "@/hooks/use-translation";
import { settingsService } from "@/services/notification.service";
import { userService } from "@/services/user.service";
import { mockSubscriptionPlans } from "@/lib/mock-data";
import { useAuthStore } from "@/stores/auth-store";
import { usePlayerStore } from "@/stores/player-store";
import type { UserSettings } from "@/types";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    settingsService.getSettings().then(setSettings);
  }, []);

  const update = async (patch: Partial<UserSettings>) => {
    const updated = await settingsService.updateSettings(patch);
    setSettings(updated);
    // Keep the live player in sync with the system volume setting
    if (patch.volume !== undefined) {
      usePlayerStore.getState().setVolume(patch.volume);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleting) return;
    setDeleting(true);
    try {
      await userService.deleteAccount(user.id);
      logout();
      router.replace(routes.login);
    } finally {
      setDeleting(false);
    }
  };

  if (!settings) {
    return (
      <p className="py-20 text-center text-muted-foreground">
        {t("common.loading")}
      </p>
    );
  }

  return (
    <FadeIn className="mx-auto max-w-2xl space-y-8 py-4">
      <SectionHeader title={t("settings.title")} />

      <section className="space-y-4 rounded-xl bg-card/40 p-6">
        <h3 className="font-semibold">{t("settings.notifications")}</h3>
        <label className="flex items-center justify-between">
          <span className="text-sm leading-6">
            {t("settings.notificationsEnabled")}
          </span>
          <Checkbox
            checked={settings.notificationsEnabled}
            onChange={(e) => update({ notificationsEnabled: e.target.checked })}
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
          {mockSubscriptionPlans.map((plan) => {
            const isCurrent = plan.tier === user?.subscription;
            return (
              <div
                key={plan.tier}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-4 transition-colors",
                  isCurrent
                    ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30"
                    : "border-border",
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{plan.name}</p>
                    {isCurrent && <Badge>{t("settings.currentBadge")}</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.price === 0
                      ? t("common.free")
                      : `${plan.price.toLocaleString()} ${t("subscription.toman")}`}
                  </p>
                </div>
                {/* Upgrade flow redirects to the payment page in phase 2 */}
                {!isCurrent && (
                  <Button variant="outline" size="sm" disabled>
                    {t("settings.upgradePhase2")}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h3 className="font-semibold text-destructive">
          {t("settings.deleteAccount")}
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t("settings.deleteAccountHint")}
        </p>
        <Button
          variant="destructive"
          className="mt-4"
          size="sm"
          onClick={() => setDeleteOpen(true)}
        >
          {t("settings.deleteAccountButton")}
        </Button>
      </section>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t("settings.deleteConfirmTitle")}
        closeLabel={t("common.close")}
        footer={
          <div className="flex gap-3">
            <Button
              variant="destructive"
              className="flex-1"
              disabled={deleting}
              onClick={handleDeleteAccount}
            >
              {deleting ? t("common.loading") : t("settings.deleteConfirmAction")}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteOpen(false)}
            >
              {t("common.cancel")}
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-7 text-muted-foreground">
          {t("settings.deleteConfirmBody")}
        </p>
      </Dialog>
    </FadeIn>
  );
}
