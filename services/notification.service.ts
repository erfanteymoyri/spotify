import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { Notification } from "@/types";

/**
 * The inbox is already scoped to the signed-in user *and* their role: the
 * backend addressed each notification to specific recipients when it was
 * created, so there is nothing to filter client-side.
 */
export const notificationService = {
  getNotifications(unreadOnly = false): Promise<Notification[]> {
    return apiClient<Notification[]>(endpoints.notifications.list, {
      method: "GET",
      query: unreadOnly ? { unread: true } : undefined,
    });
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient<Notification>(endpoints.notifications.markRead(id), {
      method: "PATCH",
    });
  },

  async markAllAsRead(): Promise<void> {
    await apiClient<{ unread: number }>(endpoints.notifications.readAll, {
      method: "PATCH",
    });
  },

  async deleteNotification(id: string): Promise<void> {
    await apiClient<void>(endpoints.notifications.delete(id), {
      method: "DELETE",
    });
  },

  getUnreadCount(): Promise<number> {
    return apiClient<{ unread: number }>(endpoints.notifications.unreadCount, {
      method: "GET",
    }).then((response) => response.unread);
  },
};
