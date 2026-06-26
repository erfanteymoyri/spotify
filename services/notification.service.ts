import { mockNotifications, mockSettings } from "@/lib/mock-data";

export const notificationService = {
  /**
   * GET /notifications
   * Response: Notification[] — filtered by user role on the backend
   */
  async getNotifications() {
    // return apiClient(endpoints.notifications.list, { method: "GET", token });

    await delay(200);
    return mockNotifications;
  },

  /**
   * PATCH /notifications/:id/read
   */
  async markAsRead(id: string) {
    // return apiClient(endpoints.notifications.markRead(id), { method: "PATCH", token });

    void id;
    await delay(100);
  },

  /**
   * PATCH /notifications/read-all
   */
  async markAllAsRead() {
    // return apiClient(endpoints.notifications.readAll, { method: "PATCH", token });

    await delay(100);
  },

  /**
   * DELETE /notifications/:id
   */
  async deleteNotification(id: string) {
    // return apiClient(endpoints.notifications.delete(id), { method: "DELETE", token });

    void id;
    await delay(100);
  },
};

export const settingsService = {
  /**
   * GET /settings
   * Response: { notificationsEnabled, volume, language }
   */
  async getSettings() {
    // return apiClient(endpoints.settings.get, { method: "GET", token });

    await delay(200);
    return mockSettings;
  },

  /**
   * PATCH /settings
   * Body: Partial<UserSettings>
   */
  async updateSettings(data: Partial<typeof mockSettings>) {
    // return apiClient(endpoints.settings.update, { method: "PATCH", body: data, token });

    void data;
    await delay(200);
    return { ...mockSettings, ...data };
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
