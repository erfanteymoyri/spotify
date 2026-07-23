import { describe, expect, it } from "vitest";
import { canCreatePlaylist, subscriptionLimits } from "@/config/subscription";

describe("subscriptionLimits (spec table 1)", () => {
  it("caps free playlists at 6 and daily streams at 60", () => {
    expect(subscriptionLimits.free.maxPlaylists).toBe(6);
    expect(subscriptionLimits.free.maxDailyStreams).toBe(60);
  });

  it("gives silver unlimited streams but capped playlists", () => {
    expect(subscriptionLimits.silver.maxDailyStreams).toBeNull();
    expect(subscriptionLimits.silver.maxPlaylists).toBe(100);
  });

  it("unlocks every perk for gold", () => {
    expect(subscriptionLimits.gold.maxPlaylists).toBeNull();
    expect(subscriptionLimits.gold.hasEarlyAccess).toBe(true);
    expect(subscriptionLimits.gold.canViewStats).toBe(true);
  });

  it("gates avatar upload behind a paid tier", () => {
    expect(subscriptionLimits.free.canUploadAvatar).toBe(false);
    expect(subscriptionLimits.silver.canUploadAvatar).toBe(true);
    expect(subscriptionLimits.gold.canUploadAvatar).toBe(true);
  });
});

describe("canCreatePlaylist", () => {
  it("blocks a free user at the limit", () => {
    expect(canCreatePlaylist("free", 5)).toBe(true);
    expect(canCreatePlaylist("free", 6)).toBe(false);
    expect(canCreatePlaylist("free", 7)).toBe(false);
  });

  it("blocks a silver user only at 100", () => {
    expect(canCreatePlaylist("silver", 99)).toBe(true);
    expect(canCreatePlaylist("silver", 100)).toBe(false);
  });

  it("never blocks a gold user", () => {
    expect(canCreatePlaylist("gold", 10_000)).toBe(true);
  });
});
