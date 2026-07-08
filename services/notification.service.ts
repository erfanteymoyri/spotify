import { mockNotifications, mockSettings } from "@/lib/mock-data";
import { delay } from "@/lib/service-utils";
import type { UserSettings } from "@/types";

export const notificationService = {
  /** GET /notifications — filtered by user role on the backend */
  async getNotifications() {
    await delay(200);
    return mockNotifications;
  },

  /** PATCH /notifications/:id/read */
  async markAsRead(id: string) {
    void id;
    await delay(100);
  },

  /** PATCH /notifications/read-all */
  async markAllAsRead() {
    await delay(100);
  },

  /** DELETE /notifications/:id */
  async deleteNotification(id: string) {
    void id;
    await delay(100);
  },
};

export const settingsService = {
  /** GET /settings */
  async getSettings() {
    await delay(200);
    return mockSettings;
  },

  /** PATCH /settings */
  async updateSettings(data: Partial<UserSettings>) {
    void data;
    await delay(200);
    return { ...mockSettings, ...data };
  },
};
