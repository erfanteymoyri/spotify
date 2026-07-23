"use client";

import { Avatar } from "@/ui/avatar";
import { Button } from "@/ui/button";
import { FadeIn } from "@/components/shared/motion";
import { SectionHeader } from "@/components/shared/section-header";
import { subscriptionLimits } from "@/config/subscription";
import { useTranslation } from "@/hooks/use-translation";
import { formatDate, formatNumber } from "@/lib/format";
import type { SubscriptionTier, User } from "@/types";

const subscriptionKey = {
  free: "subscription.free",
  silver: "subscription.silver",
  gold: "subscription.gold",
} satisfies Record<SubscriptionTier, string>;

interface ProfileViewProps {
  user: User;
  /** Own profile shows edit controls; other profiles show follow/unfollow */
  isOwn: boolean;
  isFollowing?: boolean;
  followLoading?: boolean;
  onEdit?: () => void;
  onToggleFollow?: () => void;
}

export function ProfileView({
  user,
  isOwn,
  isFollowing = false,
  followLoading = false,
  onEdit,
  onToggleFollow,
}: ProfileViewProps) {
  const { t, locale } = useTranslation();
  const limits = subscriptionLimits[user.subscription];
  const dateLocale = locale === "fa" ? "fa-IR" : "en-US";

  return (
    <FadeIn className="space-y-8 py-4">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <Avatar src={user.avatarUrl} alt={user.displayName} size="lg" />
        <div className="min-w-0 flex-1 text-center sm:text-right">
          <p className="text-sm leading-6 text-muted-foreground">
            {t("profile.title")}
          </p>
          <h1 className="mt-1 text-4xl font-bold">{user.displayName}</h1>
          <p className="mt-2 text-muted-foreground">@{user.username}</p>
          <p className="mt-3 text-sm leading-6">
            {t("common.subscription")}:{" "}
            <span className="font-medium text-primary">
              {t(subscriptionKey[user.subscription])}
            </span>
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-4 sm:justify-start">
            {isOwn ? (
              <Button variant="outline" size="sm" onClick={onEdit}>
                {t("profile.editProfile")}
              </Button>
            ) : (
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                disabled={followLoading}
                onClick={onToggleFollow}
              >
                {followLoading
                  ? t("common.loading")
                  : isFollowing
                    ? t("common.unfollow")
                    : t("common.follow")}
              </Button>
            )}
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
        <dl className="grid gap-x-10 gap-y-6 rounded-xl bg-card/40 p-6 sm:grid-cols-2 sm:p-7">
          <InfoRow label={t("common.email")} value={user.email} />
          <InfoRow label={t("profile.username")} value={user.username} />
          {user.birthDate && (
            <InfoRow
              label={t("profile.birthDate")}
              value={formatDate(user.birthDate, dateLocale)}
            />
          )}
          {user.gender && (
            <InfoRow
              label={t("profile.gender")}
              value={t(`auth.${user.gender}`)}
            />
          )}
        </dl>
      </section>

      {isOwn && !limits.canUploadAvatar && (
        <p className="text-sm text-muted-foreground">
          {t("profile.avatarUpgradeHint")}
        </p>
      )}
    </FadeIn>
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
    <div className="rounded-xl bg-card/40 p-5 text-center transition-colors hover:bg-card/60">
      <p className="text-2xl font-bold tabular-nums">
        {typeof value === "number" ? formatNumber(value) : value}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm leading-6 text-muted-foreground">{label}</dt>
      {/* dir=auto keeps LTR values (emails) readable inside the RTL layout */}
      <dd dir="auto" className="mt-1.5 leading-7 font-medium break-words">
        {value}
      </dd>
    </div>
  );
}
