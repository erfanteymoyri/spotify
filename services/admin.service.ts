import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type {
  AdminStats,
  ArtistPayout,
  ArtistRequest,
  ArtistStatus,
  SubscriptionPricing,
  SupportTicket,
  TicketStatus,
} from "@/types";

/**
 * Back-office API.
 *
 * Support agents may read the queues and the accounting table; changing prices,
 * reading platform statistics and authorising settlements are the
 * administrator's alone. The server enforces that split — this module only
 * describes the calls.
 */
export const adminService = {
  // --- Support tickets ---
  getTickets(status?: TicketStatus): Promise<SupportTicket[]> {
    return apiClient<SupportTicket[]>(endpoints.admin.tickets, {
      method: "GET",
      query: { status },
    });
  },

  getTicket(id: string): Promise<SupportTicket> {
    return apiClient<SupportTicket>(endpoints.admin.ticketById(id), {
      method: "GET",
    });
  },

  replyToTicket(id: string, content: string): Promise<SupportTicket> {
    return apiClient<SupportTicket>(endpoints.admin.ticketReply(id), {
      method: "POST",
      body: { content },
    });
  },

  setTicketStatus(id: string, status: TicketStatus): Promise<SupportTicket> {
    return apiClient<SupportTicket>(endpoints.admin.ticketStatus(id), {
      method: "PATCH",
      body: { status },
    });
  },

  // --- Artist verification ---
  getArtistRequests(status: ArtistStatus | "all" = "pending"): Promise<ArtistRequest[]> {
    return apiClient<ArtistRequest[]>(endpoints.admin.artistRequests, {
      method: "GET",
      query: { status },
    });
  },

  /** Approving unlocks the studio; rejecting requires a reason. */
  reviewArtist(
    id: string,
    action: "approve" | "reject",
    reason?: string,
  ): Promise<ArtistRequest> {
    return apiClient<ArtistRequest>(endpoints.admin.reviewArtist(id), {
      method: "PATCH",
      body: { action, reason: reason ?? "" },
    });
  },

  // --- Accounting ---
  /** `month` as `YYYY-MM`; defaults to the current period. */
  getPayouts(month?: string): Promise<ArtistPayout[]> {
    return apiClient<ArtistPayout[]>(endpoints.admin.accounting, {
      method: "GET",
      query: { month },
    });
  },

  settlePayout(id: string): Promise<ArtistPayout> {
    return apiClient<ArtistPayout>(endpoints.admin.settlePayment(id), {
      method: "PATCH",
    });
  },

  // --- Pricing & statistics (administrator) ---
  getPricing(): Promise<SubscriptionPricing> {
    return apiClient<SubscriptionPricing>(endpoints.admin.pricing, {
      method: "GET",
    });
  },

  updatePricing(pricing: SubscriptionPricing): Promise<SubscriptionPricing> {
    return apiClient<SubscriptionPricing>(endpoints.admin.pricing, {
      method: "PATCH",
      body: pricing,
    });
  },

  /**
   * Aggregated platform figures. Every number arrives finished — the backend
   * does the counting (spec 3.7).
   */
  getStats(): Promise<AdminStats> {
    return apiClient<AdminStats>(endpoints.admin.stats, { method: "GET" });
  },
};
