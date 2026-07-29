"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { authService } from "@/services/auth.service";
import { settingsService, userService } from "@/services/user.service";
import { subscriptionService } from "@/services/subscription.service";
import { isUpgrade } from "@/config/subscription";
import { usePlans } from "@/providers/plans-provider";
import { useAuthStore } from "@/stores/auth-store";
import { usePlayerStore } from "@/stores/player-store";
import { parseApiError } from "@/lib/parse-api-error";
import { toast } from "@/lib/toast";
import type { SubscriptionTier, UserSettings } from "@/types";
import { cn } from "@/lib/utils";

/**
 * `useSearchParams` opts the subtree into client-side rendering, so the page
 * body lives in its own component behind a Suspense boundary.
 */
export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <p className="py-20 text-center text-muted-foreground">
          {t("common.loading")}
        </p>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [purchasing, setPurchasing] = useState<SubscriptionTier | null>(null);

  // Prices and limits come straight from the API, so an administrator's change
  // is reflected here with no code edit (spec 2.11.3).
  const { plans } = usePlans();

  useEffect(() => {
    settingsService.getSettings().then(setSettings);
  }, []);

  /**
   * The gateway sends the browser back here with `?payment=<id>&status=<state>`.
   * Re-reading the user picks up the new tier, since the subscription was
   * granted server-side while we were away.
   *
   * The ref makes this run exactly once per return trip: `router.replace` only
   * clears the query string on a later tick, so without it a re-render in
   * between would announce the same payment again.
   */
  const paymentHandledRef = useRef(false);

  useEffect(() => {
    const status = searchParams.get("status");
    if (!status || paymentHandledRef.current) return;
    paymentHandledRef.current = true;

    if (status === "succeeded") {
      authService
        .getMe()
        .then(updateUser)
        .then(() => toast.success(t("subscription.paymentSucceeded")))
        .catch(() => toast.error(t("subscription.paymentFailed")));
    } else {
      toast.error(t("subscription.paymentFailed"));
    }
    router.replace(routes.settings);
  }, [searchParams, router, updateUser, t]);

  const update = async (patch: Partial<UserSettings>) => {
    const updated = await settingsService.updateSettings(patch);
    setSettings(updated);
    // Keep the live player in sync with the system volume setting
    if (patch.volume !== undefined) {
      usePlayerStore.getState().setVolume(patch.volume);
    }
  };

  /**
   * Opens a transaction and hands the browser to the payment gateway. The
   * subscription is granted only once the gateway confirms (spec 3.6).
   */
  const handlePurchase = async (tier: Exclude<SubscriptionTier, "free">) => {
    if (purchasing) return;
    setPurchasing(tier);
    try {
      const { paymentUrl } = await subscriptionService.startCheckout(tier, 1);
      window.location.assign(paymentUrl);
    } catch (err) {
      toast.error(parseApiError(err, t("subscription.checkoutFailed")));
      setPurchasing(null);
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

      <section className="space-y-4 rounded-xl bg-card/40 p-6">
        <h3 className="font-semibold">{t("settings.currentPlan")}</h3>
        <div className="grid gap-3">
          {plans.map((plan) => {
            const currentTier = user?.subscription ?? "free";
            const isCurrent = plan.tier === currentTier;
            // Every paid plan stays buyable, whatever the user is on today:
            // re-buying the current tier queues another period after the one
            // running (no paid days lost), and any other tier takes effect at
            // once. `Subscription.activate` owns both cases server-side.
            const purchasable = plan.tier !== "free";
            const actionLabel = isCurrent
              ? t("settings.renew")
              : isUpgrade(currentTier, plan.tier)
                ? t("settings.upgrade")
                : t("settings.switchPlan");
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
                {purchasable && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={purchasing !== null}
                    onClick={() =>
                      handlePurchase(plan.tier as Exclude<SubscriptionTier, "free">)
                    }
                  >
                    {purchasing === plan.tier
                      ? t("common.loading")
                      : actionLabel}
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
