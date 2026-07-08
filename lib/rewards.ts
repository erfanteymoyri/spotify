import type { SubscriptionPricing } from "@/types";

/** Default subscription prices (Toman) — admins override these at runtime */
export const DEFAULT_PRICING: SubscriptionPricing = {
  silver: 99_000,
  gold: 199_000,
};

/**
 * Artist reward as a function of unique listeners and total streams.
 * The exact coefficients live in one place so phase 2 can swap the formula
 * without touching any UI. Kept deterministic for reproducible mock tables.
 */
export function calculateArtistReward(
  uniqueListeners: number,
  totalStreams: number,
): number {
  const LISTENER_RATE = 1_200;
  const STREAM_RATE = 300;
  return uniqueListeners * LISTENER_RATE + totalStreams * STREAM_RATE;
}
