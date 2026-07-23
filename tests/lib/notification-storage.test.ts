import { beforeEach, describe, expect, it } from "vitest";
import { notificationStorage } from "@/lib/notification-storage";

beforeEach(() => localStorage.clear());

describe("notificationStorage role filtering (spec 2.6)", () => {
  it("shows listeners only their notification types", () => {
    const types = notificationStorage.getForRole("listener").map((n) => n.type);
    expect(types).toContain("new_release");
    expect(types).not.toContain("new_ticket");
  });

  it("shows support agents ticket & verification notifications", () => {
    const types = notificationStorage.getForRole("support").map((n) => n.type);
    expect(types).toContain("new_ticket");
    expect(types).not.toContain("subscription_expiry");
  });

  it("shows artists their approval/payout notifications", () => {
    const types = notificationStorage.getForRole("artist").map((n) => n.type);
    expect(types).toContain("monthly_payout");
  });
});

describe("notificationStorage mutations", () => {
  it("marks a single notification as read", () => {
    const first = notificationStorage.getForRole("listener")[0];
    notificationStorage.markRead(first.id);
    const after = notificationStorage
      .getForRole("listener")
      .find((n) => n.id === first.id);
    expect(after?.isRead).toBe(true);
  });

  it("marks all notifications for a role as read", () => {
    notificationStorage.markAllRead("listener");
    const unread = notificationStorage
      .getForRole("listener")
      .filter((n) => !n.isRead);
    expect(unread).toHaveLength(0);
  });

  it("adds a new unread notification at the top", () => {
    const before = notificationStorage.getForRole("artist").length;
    notificationStorage.add({
      type: "artist_approval",
      title: "Approved",
      message: "Welcome",
    });
    const after = notificationStorage.getForRole("artist");
    expect(after.length).toBe(before + 1);
    expect(after[0].isRead).toBe(false);
  });

  it("removes a notification", () => {
    const target = notificationStorage.getForRole("listener")[0];
    notificationStorage.remove(target.id);
    const stillThere = notificationStorage
      .getForRole("listener")
      .some((n) => n.id === target.id);
    expect(stillThere).toBe(false);
  });
});
