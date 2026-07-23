import { mockSettings } from "@/lib/mock-data";
import { notificationStorage } from "@/lib/notification-storage";
import { readJson, writeJson } from "@/lib/local-store";
import { delay } from "@/lib/service-utils";
import type { Notification, UserRole, UserSettings } from "@/types";

export const notificationService = {
  /** GET /notifications — the backend filters by the authenticated user's role */
  async getNotifications(role: UserRole): Promise<Notification[]> {
    await delay(200);
    return notificationStorage.getForRole(role);
  },

  /** PATCH /notifications/:id/read */
  async markAsRead(id: string): Promise<void> {
    await delay(100);
    notificationStorage.markRead(id);
  },

  /** PATCH /notifications/read-all */
  async markAllAsRead(role: UserRole): Promise<void> {
    await delay(100);
    notificationStorage.markAllRead(role);
  },

  /** DELETE /notifications/:id */
  async deleteNotification(id: string): Promise<void> {
    await delay(100);
    notificationStorage.remove(id);
  },
};

const SETTINGS_KEY = "spotify-settings";

export const settingsService = {
  /** GET /settings */
  async getSettings(): Promise<UserSettings> {
    await delay(200);
    return readJson<UserSettings>(SETTINGS_KEY, mockSettings);
  },

  /** PATCH /settings */
  async updateSettings(data: Partial<UserSettings>): Promise<UserSettings> {
    await delay(200);
    const current = readJson<UserSettings>(SETTINGS_KEY, mockSettings);
    const updated = { ...current, ...data };
    writeJson(SETTINGS_KEY, updated);
    return updated;
  },
};
