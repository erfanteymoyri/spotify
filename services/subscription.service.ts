import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type {
  Payment,
  Subscription,
  SubscriptionPlan,
  SubscriptionTier,
} from "@/types";

export interface CurrentSubscription {
  tier: SubscriptionTier;
  plan: SubscriptionPlan;
  /** Null on a free account. */
  subscription: Subscription | null;
}

export interface CheckoutResponse {
  payment: Payment;
  /** Where to send the browser to complete the transaction. */
  paymentUrl: string;
}

/** Purchasable durations (spec 3.2). */
export const BILLING_PERIODS = [1, 3, 6, 12] as const;
export type BillingPeriod = (typeof BILLING_PERIODS)[number];

export const subscriptionService = {
  /**
   * Prices *and* limits for every tier.
   *
   * The single source of truth for table 1 — the UI renders quotas and feature
   * availability from this, so an administrator re-pricing or re-scoping a tier
   * needs no frontend change.
   */
  getPlans(): Promise<SubscriptionPlan[]> {
    return apiClient<SubscriptionPlan[]>(endpoints.subscriptions.plans, {
      method: "GET",
      anonymous: true,
    });
  },

  getMySubscription(): Promise<CurrentSubscription> {
    return apiClient<CurrentSubscription>(endpoints.subscriptions.me, {
      method: "GET",
    });
  },

  getHistory(): Promise<Subscription[]> {
    return apiClient<Subscription[]>(endpoints.subscriptions.history, {
      method: "GET",
    });
  },

  /** Opens a pending transaction; nothing is granted until it settles. */
  startCheckout(
    tier: Exclude<SubscriptionTier, "free">,
    durationMonths: BillingPeriod,
  ): Promise<CheckoutResponse> {
    return apiClient<CheckoutResponse>(endpoints.subscriptions.checkout, {
      method: "POST",
      body: { tier, durationMonths },
    });
  },

  /** Polled after returning from the gateway. */
  getPayment(id: string): Promise<Payment> {
    return apiClient<Payment>(endpoints.payments.byId(id), { method: "GET" });
  },

  getPayments(): Promise<Payment[]> {
    return apiClient<Payment[]>(endpoints.payments.list, { method: "GET" });
  },
};
