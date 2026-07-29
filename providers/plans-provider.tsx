"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { subscriptionService } from "@/services/subscription.service";
import type { SubscriptionPlan, SubscriptionTier } from "@/types";

interface PlansContextValue {
  plans: SubscriptionPlan[];
  loading: boolean;
  planFor: (tier: SubscriptionTier) => SubscriptionPlan | null;
  /** Re-fetches after an administrator changes prices. */
  refresh: () => void;
}

const PlansContext = createContext<PlansContextValue>({
  plans: [],
  loading: true,
  planFor: () => null,
  refresh: () => {},
});

/**
 * Fetches the subscription plans once and shares them app-wide.
 *
 * Plan data drives quota hints, feature gating and the pricing table, and it is
 * needed on nearly every screen — but it changes only when an administrator
 * edits it. Loading it once here avoids a request per component while keeping
 * the limits server-owned rather than hard-coded in the client.
 */
export function PlansProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  // Bumping this re-runs the fetch effect; simpler than juggling an abortable
  // callback, and it keeps all the request logic inside the effect.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    subscriptionService
      .getPlans()
      .then((result) => {
        if (!cancelled) setPlans(result);
      })
      .catch(() => {
        // A plans outage must not blank the app: components fall back to
        // permissive behaviour and the server still enforces the real limits.
        if (!cancelled) setPlans([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const refresh = useCallback(() => setReloadToken((token) => token + 1), []);

  const value = useMemo<PlansContextValue>(
    () => ({
      plans,
      loading,
      planFor: (tier) => plans.find((plan) => plan.tier === tier) ?? null,
      refresh,
    }),
    [plans, loading, refresh],
  );

  return <PlansContext.Provider value={value}>{children}</PlansContext.Provider>;
}

export function usePlans(): PlansContextValue {
  return useContext(PlansContext);
}

/** Convenience for the common "what can this tier do?" question. */
export function usePlan(tier: SubscriptionTier | undefined): SubscriptionPlan | null {
  const { planFor } = usePlans();
  return tier ? planFor(tier) : null;
}
