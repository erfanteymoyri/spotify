"use client";

import { useEffect, useState } from "react";
import { DonutChart, type DonutSegment } from "@/components/charts/donut-chart";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/hooks/use-translation";
import { formatNumber } from "@/lib/format";
import { adminService } from "@/services/admin.service";
import type { AdminStats, SubscriptionPricing, SubscriptionTier } from "@/types";

const TIER_COLORS: Record<SubscriptionTier, string> = {
  free: "var(--chart-2)",
  silver: "var(--muted-foreground)",
  gold: "var(--chart-3)",
};

export default function AdminPricingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [pricing, setPricing] = useState<SubscriptionPricing | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [silver, setSilver] = useState("");
  const [gold, setGold] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([adminService.getPricing(), adminService.getStats()]).then(
      ([price, statsData]) => {
        setPricing(price);
        setStats(statsData);
        setSilver(String(price.silver));
        setGold(String(price.gold));
      },
    );
  }, [isAdmin]);

  const save = async () => {
    setSaving(true);
    const updated = await adminService.updatePricing({
      silver: Number(silver) || 0,
      gold: Number(gold) || 0,
    });
    setPricing(updated);
    setSaving(false);
    setSaved(true);
  };

  if (!isAdmin) {
    return (
      <EmptyState
        title={t("admin.adminOnlyTitle")}
        description={t("admin.adminOnlyDescription")}
      />
    );
  }

  if (!pricing || !stats) {
    return (
      <p className="py-20 text-center text-muted-foreground">
        {t("common.loading")}
      </p>
    );
  }

  const dirty = silver !== String(pricing.silver) || gold !== String(pricing.gold);

  const segments: DonutSegment[] = stats.tierDistribution.map((entry) => ({
    label: t(`subscription.${entry.tier}`),
    value: entry.count,
    color: TIER_COLORS[entry.tier],
  }));

  return (
    <div className="space-y-8">
      <SectionHeader
        title={t("admin.pricingTitle")}
        subtitle={t("admin.pricingSubtitle")}
      />

      <section className="max-w-md space-y-4 rounded-xl bg-card/40 p-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("admin.silverPrice")}
          </label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={silver}
            onChange={(e) => {
              setSilver(e.target.value);
              setSaved(false);
            }}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.goldPrice")}</label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={gold}
            onChange={(e) => {
              setGold(e.target.value);
              setSaved(false);
            }}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving || !dirty}>
            {saving ? t("common.saving") : t("admin.savePricing")}
          </Button>
          {saved && !dirty && (
            <span className="text-sm text-primary">{t("common.saved")}</span>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader title={t("admin.revenueTitle")} />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl bg-card/40 p-6">
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">
              {t("admin.tierDistribution")}
            </h3>
            <DonutChart
              segments={segments}
              total={stats.totalUsers}
              centerLabel={t("admin.usersUnit")}
            />
          </div>

          <div className="grid content-start gap-4 sm:grid-cols-2">
            <WidgetCard
              label={t("admin.monthlyRevenue")}
              value={`${formatNumber(stats.monthlyRevenue)} ${t("subscription.toman")}`}
            />
            <WidgetCard
              label={t("admin.totalUsers")}
              value={formatNumber(stats.totalUsers)}
            />
            <WidgetCard
              label={t("admin.totalArtists")}
              value={formatNumber(stats.totalArtists)}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function WidgetCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card/40 p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
