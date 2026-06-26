import type { SubscriptionPlan, SubscriptionTier } from "@/types";

/** Subscription limits per project spec (table 1) */
export const subscriptionLimits: Record<
  SubscriptionTier,
  Omit<SubscriptionPlan, "tier" | "name" | "price" | "currency">
> = {
  free: {
    maxDailyStreams: 60,
    maxPlaylists: 6,
    canUploadAvatar: false,
    canDownload: false,
    hasEarlyAccess: false,
    canViewStats: false,
  },
  silver: {
    maxDailyStreams: 100,
    maxPlaylists: 100,
    canUploadAvatar: true,
    canDownload: true,
    hasEarlyAccess: false,
    canViewStats: false,
  },
  gold: {
    maxDailyStreams: null,
    maxPlaylists: null,
    canUploadAvatar: true,
    canDownload: true,
    hasEarlyAccess: true,
    canViewStats: true,
  },
};

export function canCreatePlaylist(
  tier: SubscriptionTier,
  currentCount: number,
): boolean {
  const limit = subscriptionLimits[tier].maxPlaylists;
  if (limit === null) return true;
  return currentCount < limit;
}
