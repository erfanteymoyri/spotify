import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { backendCapabilities } from "@/config/backend";
import { adminMockStorage } from "@/lib/admin-mock-storage";
import { authMockStorage } from "@/lib/auth-mock-storage";
import { delay, shouldUseBackend } from "@/lib/service-utils";
import type {
  AdminStats,
  ArtistPayout,
  ArtistRequest,
  ArtistStatus,
  SubscriptionPricing,
  SubscriptionTier,
  SupportTicket,
  TierDistribution,
} from "@/types";

function buildStats(): AdminStats {
  const users = authMockStorage.getAllUsers();
  const pricing = adminMockStorage.getPricing();
  const tiers: SubscriptionTier[] = ["free", "silver", "gold"];

  const tierDistribution: TierDistribution[] = tiers.map((tier) => ({
    tier,
    count: users.filter((user) => user.subscription === tier).length,
  }));

  const priceByTier: Record<SubscriptionTier, number> = {
    free: 0,
    silver: pricing.silver,
    gold: pricing.gold,
  };
  const monthlyRevenue = tierDistribution.reduce(
    (sum, { tier, count }) => sum + count * priceByTier[tier],
    0,
  );

  return {
    tierDistribution,
    monthlyRevenue,
    totalUsers: users.length,
    totalArtists: users.filter((user) => user.role === "artist").length,
  };
}

export const adminService = {
  /** GET /admin/tickets */
  async getTickets(): Promise<SupportTicket[]> {
    if (shouldUseBackend(backendCapabilities.admin.tickets)) {
      return apiClient<SupportTicket[]>(endpoints.admin.tickets, {
        method: "GET",
      });
    }

    await delay(300);
    return adminMockStorage.getTickets();
  },

  /** GET /admin/tickets/:id — ticket with its message thread */
  async getTicket(id: string): Promise<SupportTicket | undefined> {
    if (shouldUseBackend(backendCapabilities.admin.tickets)) {
      return apiClient<SupportTicket>(endpoints.admin.ticketById(id), {
        method: "GET",
      });
    }

    await delay(200);
    return adminMockStorage.getTicket(id);
  },

  /** POST /admin/tickets/:id/messages — { content } */
  async replyToTicket(
    id: string,
    content: string,
  ): Promise<SupportTicket | undefined> {
    if (shouldUseBackend(backendCapabilities.admin.tickets)) {
      return apiClient<SupportTicket>(endpoints.admin.ticketReply(id), {
        method: "POST",
        body: { content },
      });
    }

    await delay(300);
    return adminMockStorage.replyToTicket(id, content);
  },

  /** GET /admin/artist-requests?status=pending */
  async getArtistRequests(): Promise<ArtistRequest[]> {
    if (shouldUseBackend(backendCapabilities.admin.artistRequests)) {
      return apiClient<ArtistRequest[]>(endpoints.admin.artistRequests, {
        method: "GET",
      });
    }

    await delay(300);
    return authMockStorage.getPublicArtistRequests();
  },

  /** PATCH /admin/artist-requests/:id — { action, reason? } */
  async reviewArtist(
    id: string,
    action: "approve" | "reject",
    reason?: string,
  ): Promise<{ status: ArtistStatus }> {
    if (shouldUseBackend(backendCapabilities.admin.artistRequests)) {
      return apiClient(endpoints.admin.reviewArtist(id), {
        method: "PATCH",
        body: { action, reason },
      });
    }

    await delay(300);
    authMockStorage.reviewArtistRequest(id, action);
    return { status: action === "approve" ? "approved" : "rejected" };
  },

  /** GET /admin/accounting — monthly artist payout table */
  async getPayouts(): Promise<ArtistPayout[]> {
    if (shouldUseBackend(backendCapabilities.admin.accounting)) {
      return apiClient<ArtistPayout[]>(endpoints.admin.accounting, {
        method: "GET",
      });
    }

    await delay(300);
    return adminMockStorage.getPayouts();
  },

  /** PATCH /admin/accounting/:id/settle */
  async settlePayout(id: string): Promise<void> {
    if (shouldUseBackend(backendCapabilities.admin.accounting)) {
      await apiClient<void>(endpoints.admin.settlePayment(id), {
        method: "PATCH",
      });
      return;
    }

    await delay(300);
    adminMockStorage.settlePayout(id);
  },

  /** GET /admin/pricing */
  async getPricing(): Promise<SubscriptionPricing> {
    if (shouldUseBackend(backendCapabilities.admin.pricing)) {
      return apiClient<SubscriptionPricing>(endpoints.admin.pricing, {
        method: "GET",
      });
    }

    await delay(200);
    return adminMockStorage.getPricing();
  },

  /** PATCH /admin/pricing — { silver, gold } */
  async updatePricing(
    pricing: SubscriptionPricing,
  ): Promise<SubscriptionPricing> {
    if (shouldUseBackend(backendCapabilities.admin.pricing)) {
      return apiClient<SubscriptionPricing>(endpoints.admin.updatePricing, {
        method: "PATCH",
        body: pricing,
      });
    }

    await delay(300);
    return adminMockStorage.updatePricing(pricing);
  },

  /** GET /admin/stats — tier distribution + monthly revenue (admin only) */
  async getStats(): Promise<AdminStats> {
    if (shouldUseBackend(backendCapabilities.admin.stats)) {
      return apiClient<AdminStats>(endpoints.admin.stats, { method: "GET" });
    }

    await delay(300);
    return buildStats();
  },
};
