import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { SupportTicket } from "@/types";

/** The listener-facing half of the ticket system; the queue lives in admin.service. */
export const supportService = {
  getMyTickets(): Promise<SupportTicket[]> {
    return apiClient<SupportTicket[]>(endpoints.tickets.root, { method: "GET" });
  },

  getTicket(id: string): Promise<SupportTicket> {
    return apiClient<SupportTicket>(endpoints.tickets.byId(id), { method: "GET" });
  },

  /** Opens a ticket with its first message and notifies the support team. */
  openTicket(subject: string, message: string): Promise<SupportTicket> {
    return apiClient<SupportTicket>(endpoints.tickets.root, {
      method: "POST",
      body: { subject, message },
    });
  },

  /** Replying to an answered ticket reopens it. */
  reply(id: string, content: string): Promise<SupportTicket> {
    return apiClient<SupportTicket>(endpoints.tickets.messages(id), {
      method: "POST",
      body: { content },
    });
  },
};
