import { describe, expect, it } from "vitest";
import { canCreatePlaylist, formatLimit, isUpgrade } from "@/config/subscription";
import type { SubscriptionPlan } from "@/types";

/**
 * The tier limits themselves now live in the database and arrive via
 * `GET /subscriptions/plans`, so these tests cover how the UI *interprets* a
 * plan rather than re-asserting table 1 — the backend owns that, and its own
 * suite checks it.
 */
function plan(overrides: Partial<SubscriptionPlan> = {}): SubscriptionPlan {
  return {
    tier: "free",
    name: "Free",
    price: 0,
    currency: "IRR",
    maxDailyStreams: 60,
    maxPlaylists: 6,
    canUploadAvatar: false,
    canDownload: false,
    hasEarlyAccess: false,
    canViewStats: false,
    ...overrides,
  };
}

describe("canCreatePlaylist", () => {
  it("allows creation below the plan's quota", () => {
    expect(canCreatePlaylist(plan({ maxPlaylists: 6 }), 5)).toBe(true);
  });

  it("blocks creation at and above the quota", () => {
    expect(canCreatePlaylist(plan({ maxPlaylists: 6 }), 6)).toBe(false);
    expect(canCreatePlaylist(plan({ maxPlaylists: 6 }), 7)).toBe(false);
  });

  it("treats a null quota as unlimited", () => {
    expect(canCreatePlaylist(plan({ maxPlaylists: null }), 10_000)).toBe(true);
  });

  it("stays permissive while the plan is still loading", () => {
    // The server is the real gate; blocking here would break the UI on a slow
    // or failed plans request.
    expect(canCreatePlaylist(null, 999)).toBe(true);
  });
});

describe("formatLimit", () => {
  it("renders a number as-is", () => {
    expect(formatLimit(100, "∞")).toBe("100");
  });

  it("renders null as the unlimited label", () => {
    expect(formatLimit(null, "∞")).toBe("∞");
  });
});

describe("isUpgrade", () => {
  it("recognises a move up the ladder", () => {
    expect(isUpgrade("free", "silver")).toBe(true);
    expect(isUpgrade("silver", "gold")).toBe(true);
    expect(isUpgrade("free", "gold")).toBe(true);
  });

  it("rejects sideways and downward moves", () => {
    expect(isUpgrade("gold", "gold")).toBe(false);
    expect(isUpgrade("gold", "silver")).toBe(false);
    expect(isUpgrade("silver", "free")).toBe(false);
  });
});
