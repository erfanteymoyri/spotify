"use client";

import { Avatar } from "@/ui/avatar";
import { Button } from "@/ui/button";
import { SectionHeader } from "@/components/shared/section-header";
import { useAuth } from "@/contexts/auth-context";
import { subscriptionLimits } from "@/config/subscription";
import { useTranslation } from "@/hooks/use-translation";
import { formatNumber } from "@/lib/format";
import type { SubscriptionTier } from "@/types";

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (!user) return null;

  const limits = subscriptionLimits[user.subscription];

  const subscriptionKey = {
    free: "subscription.free",
    silver: "subscription.silver",
    gold: "subscription.gold",
  } satisfies Record<SubscriptionTier, string>;

  return (
    <div className="space-y-8 py-4">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <Avatar src={user.avatarUrl} alt={user.displayName} size="lg" />
        <div className="flex-1 text-center sm:text-right">
          <p className="text-sm text-muted-foreground">{t("profile.title")}</p>
          <h1 className="text-4xl font-bold">{user.displayName}</h1>
          <p className="mt-1 text-muted-foreground">@{user.username}</p>
          <p className="mt-2 text-sm">
            {t("common.subscription")}:{" "}
            <span className="font-medium text-primary">
              {t(subscriptionKey[user.subscription])}
            </span>
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-4 sm:justify-start">
            <Button variant="outline" size="sm">
              {t("profile.editProfile")}
            </Button>
            <Button variant="outline" size="sm">
              {t("common.follow")}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label={t("profile.followers")} value={user.followersCount} />
        <StatCard label={t("profile.following")} value={user.followingCount} />
        <StatCard
          label={t("profile.streamsToday")}
          value={user.dailyStreamsCount}
        />
        <StatCard
          label={t("profile.maxDailyStreams")}
          value={limits.maxDailyStreams ?? "∞"}
        />
      </div>

      <section>
        <SectionHeader title={t("profile.accountInfo")} />
        <dl className="grid gap-4 rounded-xl bg-card/40 p-6 sm:grid-cols-2">
          <InfoRow label={t("common.email")} value={user.email} />
          <InfoRow label={t("profile.username")} value={user.username} />
          {user.birthDate && (
            <InfoRow label={t("profile.birthDate")} value={user.birthDate} />
          )}
        </dl>
      </section>

      {!limits.canUploadAvatar && (
        <p className="text-sm text-muted-foreground">
          {t("profile.avatarUpgradeHint")}
        </p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl bg-card/40 p-4 text-center">
      <p className="text-2xl font-bold">
        {typeof value === "number" ? formatNumber(value) : value}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
