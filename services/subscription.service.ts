import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type {
  BillingOption,
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
  /** The gateway's hosted payment page for this transaction. */
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

  /**
   * The purchasable durations, their discounts and the resolved total per tier.
   *
   * Deliberately server-computed: multiplying the monthly price by the number
   * of months and applying a percentage in the browser would be a second
   * implementation of the pricing rule, and the one the user is shown must be
   * the one they are charged.
   */
  getBillingOptions(): Promise<BillingOption[]> {
    return apiClient<BillingOption[]>(endpoints.subscriptions.billingOptions, {
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

  /**
   * Opens a transaction with the payment gateway.
   *
   * Note what is *not* sent: a price. The server reads it from the plan and the
   * duration, so the amount charged is never something the browser chose.
   * Nothing is granted until the gateway confirms the transaction on the
   * callback.
   */
  startCheckout(
    tier: Exclude<SubscriptionTier, "free">,
    durationMonths: BillingPeriod,
  ): Promise<CheckoutResponse> {
    return apiClient<CheckoutResponse>(endpoints.subscriptions.checkout, {
      method: "POST",
      body: { tier, durationMonths },
    });
  },

  /**
   * The authoritative record of a transaction, read after returning from the
   * gateway. Scoped to the caller server-side, so a payment id reveals nothing
   * about anyone else's transaction.
   */
  getPayment(id: string): Promise<Payment> {
    return apiClient<Payment>(endpoints.payments.byId(id), { method: "GET" });
  },

  getPayments(): Promise<Payment[]> {
    return apiClient<Payment[]>(endpoints.payments.list, { method: "GET" });
  },
};
