"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { settingsService, userService } from "@/services/user.service";
import { usePlans } from "@/providers/plans-provider";
import { useAuthStore } from "@/stores/auth-store";
import { usePlayerStore } from "@/stores/player-store";
import type { UserSettings } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Names and limits come straight from the API, so an administrator's change
  // is reflected here with no code edit (spec 2.11.3).
  const { planFor } = usePlans();
  const currentPlan = planFor(user?.subscription ?? "free");

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
      await userService.deleteAccount();
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

      {/* Buying lives on its own page, where the 1/3/6/12-month ladder and its
          discounts have room. Here we only state where the user stands. */}
      <section className="space-y-4 rounded-xl bg-card/40 p-6">
        <h3 className="font-semibold">{t("settings.currentPlan")}</h3>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
          <div className="flex items-center gap-2">
            <p className="font-medium">{currentPlan?.name ?? t("common.free")}</p>
            <Badge>{t("settings.currentBadge")}</Badge>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={routes.subscription}>{t("subscription.manage")}</Link>
          </Button>
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
