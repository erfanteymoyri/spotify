"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Minus } from "lucide-react";
import { BillingPeriodPicker } from "@/components/subscription/billing-period-picker";
import { FadeIn } from "@/components/shared/motion";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { routes } from "@/config/site";
import { formatLimit, isUpgrade } from "@/config/subscription";
import { useTranslation } from "@/hooks/use-translation";
import { formatNumber } from "@/lib/format";
import { parseApiError } from "@/lib/parse-api-error";
import { toast } from "@/lib/toast";
import { usePlans } from "@/providers/plans-provider";
import { authService } from "@/services/auth.service";
import {
  subscriptionService,
  type CurrentSubscription,
} from "@/services/subscription.service";
import { useAuthStore } from "@/stores/auth-store";
import type { BillingOption, SubscriptionPlan, SubscriptionTier } from "@/types";
import { cn } from "@/lib/utils";

type PaidTier = Exclude<SubscriptionTier, "free">;

/**
 * `useSearchParams` opts its subtree into client-side rendering, so the body
 * lives behind a Suspense boundary — same shape as the settings page.
 */
export default function SubscriptionPage() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <p className="py-20 text-center text-muted-foreground">
          {t("common.loading")}
        </p>
      }
    >
      <SubscriptionContent />
    </Suspense>
  );
}

function SubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { plans } = usePlans();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [options, setOptions] = useState<BillingOption[]>([]);
  const [months, setMonths] = useState(1);
  const [current, setCurrent] = useState<CurrentSubscription | null>(null);
  const [purchasing, setPurchasing] = useState<SubscriptionTier | null>(null);

  useEffect(() => {
    subscriptionService
      .getBillingOptions()
      .then((data) => {
        setOptions(data);
        // Open on the duration the platform actually wants to sell, rather
        // than making the discounts something the user has to go looking for.
        setMonths(data.find((option) => option.isBestValue)?.months ?? 1);
      })
      .catch(() => toast.error(t("common.error")));
  }, [t]);

  useEffect(() => {
    subscriptionService.getMySubscription().then(setCurrent).catch(() => {});
  }, []);

  /**
   * The gateway returns the browser here with `?payment=<id>&status=<state>`.
   * Re-reading the user picks up the new tier, granted server-side while we
   * were away.
   *
   * The ref makes this fire exactly once per return trip: `router.replace`
   * only clears the query string on a later tick, so a re-render in between
   * would otherwise announce the same payment twice.
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
        .then(() => subscriptionService.getMySubscription().then(setCurrent))
        .then(() => toast.success(t("subscription.paymentSucceeded")))
        .catch(() => toast.error(t("subscription.paymentFailed")));
    } else {
      toast.error(t("subscription.paymentFailed"));
    }
    router.replace(routes.subscription);
  }, [searchParams, router, updateUser, t]);

  const selectedOption = useMemo(
    () => options.find((option) => option.months === months) ?? null,
    [options, months],
  );

  const currentTier: SubscriptionTier = user?.subscription ?? "free";

  /** Opens a transaction; nothing is granted until the gateway confirms. */
  const purchase = async (tier: PaidTier) => {
    if (purchasing) return;
    setPurchasing(tier);
    try {
      const { paymentUrl } = await subscriptionService.startCheckout(
        tier,
        months as 1 | 3 | 6 | 12,
      );
      window.location.assign(paymentUrl);
    } catch (err) {
      toast.error(parseApiError(err, t("subscription.checkoutFailed")));
      setPurchasing(null);
    }
  };

  return (
    <FadeIn className="mx-auto max-w-4xl space-y-6 py-4">
      <SectionHeader
        title={t("subscription.title")}
        subtitle={t("subscription.subtitle")}
      />

      {current?.subscription && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
          <Badge>{t("subscription.currentPlan")}</Badge>
          <span className="font-medium">{current.plan.name}</span>
          <span className="text-sm text-muted-foreground">
            {t("subscription.expiresIn", {
              days: current.subscription.daysRemaining,
            })}
          </span>
        </div>
      )}

      <section className="space-y-3">
        <h3 className="font-semibold">{t("subscription.duration")}</h3>
        <BillingPeriodPicker
          options={options}
          value={months}
          onChange={setMonths}
        />
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.tier}
            plan={plan}
            months={months}
            option={selectedOption}
            currentTier={currentTier}
            purchasing={purchasing}
            onPurchase={purchase}
          />
        ))}
      </div>
    </FadeIn>
  );
}

function PlanCard({
  plan,
  months,
  option,
  currentTier,
  purchasing,
  onPurchase,
}: {
  plan: SubscriptionPlan;
  months: number;
  option: BillingOption | null;
  currentTier: SubscriptionTier;
  purchasing: SubscriptionTier | null;
  onPurchase: (tier: PaidTier) => void;
}) {
  const { t } = useTranslation();

  const isFree = plan.tier === "free";
  const isCurrent = plan.tier === currentTier;
  // Prices are quoted by the server per tier and duration; the free plan has
  // no row there, and neither does a tier the server has not priced yet.
  const total = option?.prices[plan.tier] ?? null;
  const fullTotal = option?.fullPrices[plan.tier] ?? null;
  const discounted = total !== null && fullTotal !== null && total < fullTotal;

  const durationLabel =
    months === 1
      ? t("subscription.oneMonth")
      : t("subscription.months", { count: months });

  // Every paid plan stays buyable whatever the user is on today: re-buying the
  // current tier queues another period after the one running (no paid days
  // lost), any other tier takes effect at once. The server owns both cases.
  const actionLabel = isCurrent
    ? t("subscription.renew")
    : isUpgrade(currentTier, plan.tier)
      ? t("subscription.upgrade")
      : currentTier === "free"
        ? t("subscription.buy")
        : t("subscription.switchPlan");

  const features: { label: string; value: string | boolean }[] = [
    {
      label: t("subscription.featureDailyStreams"),
      value: formatLimit(plan.maxDailyStreams, t("subscription.unlimited")),
    },
    {
      label: t("subscription.featurePlaylists"),
      value: formatLimit(plan.maxPlaylists, t("subscription.unlimited")),
    },
    { label: t("subscription.featureAvatar"), value: plan.canUploadAvatar },
    { label: t("subscription.featureDownload"), value: plan.canDownload },
    { label: t("subscription.featureEarlyAccess"), value: plan.hasEarlyAccess },
    { label: t("subscription.featureStats"), value: plan.canViewStats },
  ];

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border p-5 transition-colors",
        isCurrent
          ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30"
          : "border-border bg-card/40",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">{plan.name}</h3>
        {isCurrent && <Badge>{t("subscription.currentBadge")}</Badge>}
      </div>

      <div className="space-y-1">
        {isFree || total === null ? (
          <p className="text-2xl font-bold">{t("subscription.freeForever")}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums">
                {formatNumber(total)}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("subscription.toman")}
              </span>
              {discounted && (
                <span className="text-sm text-muted-foreground line-through tabular-nums">
                  {formatNumber(fullTotal)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("subscription.totalFor", { duration: durationLabel })}
              {" · "}
              {t("subscription.perMonth", {
                price: formatNumber(Math.round(total / months)),
              })}
            </p>
          </>
        )}
      </div>

      <ul className="flex-1 space-y-2 text-sm">
        {features.map((feature) => (
          <li key={feature.label} className="flex items-center gap-2">
            {typeof feature.value === "boolean" ? (
              feature.value ? (
                <Check className="size-4 shrink-0 text-primary" />
              ) : (
                <Minus className="size-4 shrink-0 text-muted-foreground/60" />
              )
            ) : (
              <Check className="size-4 shrink-0 text-primary" />
            )}
            <span
              className={cn(
                feature.value === false && "text-muted-foreground/60",
              )}
            >
              {feature.label}
              {typeof feature.value === "string" && `: ${feature.value}`}
            </span>
          </li>
        ))}
      </ul>

      {!isFree && (
        <Button
          className="w-full"
          variant={isCurrent ? "outline" : "default"}
          disabled={purchasing !== null}
          onClick={() => onPurchase(plan.tier as PaidTier)}
        >
          {purchasing === plan.tier ? t("common.loading") : actionLabel}
        </Button>
      )}
    </div>
  );
}
