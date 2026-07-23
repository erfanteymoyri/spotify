import { createId, readJson, writeJson } from "@/lib/local-store";
import { mockNotifications } from "@/lib/mock-data";
import type { Notification, NotificationType, UserRole } from "@/types";

const NOTIFICATIONS_KEY = "spotify-notifications";

/** Which notification types each role receives (spec 2.6) */
const ROLE_TYPES: Record<UserRole, NotificationType[]> = {
  listener: ["subscription_expiry", "new_release"],
  artist: ["artist_approval", "artist_rejection", "monthly_payout"],
  support: ["new_ticket", "artist_verification_request"],
  admin: ["new_ticket", "artist_verification_request"],
};

function getAll(): Notification[] {
  const stored = readJson<Notification[] | null>(NOTIFICATIONS_KEY, null);
  if (stored) return stored;
  writeJson(NOTIFICATIONS_KEY, mockNotifications);
  return mockNotifications;
}

export const notificationStorage = {
  getForRole(role: UserRole): Notification[] {
    const allowed = ROLE_TYPES[role];
    return getAll().filter((n) => allowed.includes(n.type));
  },

  /** Push a freshly generated notification (artist review results, …) */
  add(input: Omit<Notification, "id" | "isRead" | "createdAt">): void {
    const notification: Notification = {
      ...input,
      id: createId("notif"),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    writeJson(NOTIFICATIONS_KEY, [notification, ...getAll()]);
  },

  markRead(id: string): void {
    writeJson(
      NOTIFICATIONS_KEY,
      getAll().map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  },

  markAllRead(role: UserRole): void {
    const allowed = ROLE_TYPES[role];
    writeJson(
      NOTIFICATIONS_KEY,
      getAll().map((n) =>
        allowed.includes(n.type) ? { ...n, isRead: true } : n,
      ),
    );
  },

  remove(id: string): void {
    writeJson(
      NOTIFICATIONS_KEY,
      getAll().filter((n) => n.id !== id),
    );
  },
};
