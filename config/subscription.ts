import type { SubscriptionPlan, SubscriptionTier } from "@/types";

/**
 * Pure helpers over a plan.
 *
 * The limits themselves are **not** defined here any more — they come from
 * `GET /subscriptions/plans`, so table 1 lives in the database and an
 * administrator can re-scope a tier without a frontend release. These functions
 * only interpret a plan the server already sent.
 *
 * `null` consistently means "unlimited", matching `SubscriptionPlan`.
 */

export function canCreatePlaylist(
  plan: SubscriptionPlan | null | undefined,
  currentCount: number,
): boolean {
  // Unknown plan (still loading): allow the attempt. The server is the real
  // gate and answers PLAYLIST_LIMIT_REACHED if it is not, which the UI surfaces.
  if (!plan) return true;
  if (plan.maxPlaylists === null) return true;
  return currentCount < plan.maxPlaylists;
}

export function formatLimit(limit: number | null, unlimitedLabel: string): string {
  return limit === null ? unlimitedLabel : String(limit);
}

/** Free < silver < gold — used to decide whether a plan is an upgrade. */
const TIER_ORDER: Record<SubscriptionTier, number> = {
  free: 0,
  silver: 1,
  gold: 2,
};

export function isUpgrade(from: SubscriptionTier, to: SubscriptionTier): boolean {
  return TIER_ORDER[to] > TIER_ORDER[from];
}
