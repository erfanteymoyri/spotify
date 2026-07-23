import { beforeEach, describe, expect, it } from "vitest";
import { followStorage } from "@/lib/follow-storage";

beforeEach(() => localStorage.clear());

describe("followStorage", () => {
  it("reports no relation by default", () => {
    expect(followStorage.isFollowing("u1", "artist-1")).toBe(false);
  });

  it("persists a new follow and reports change", () => {
    const changed = followStorage.set("u1", "artist-1", true);
    expect(changed).toBe(true);
    expect(followStorage.isFollowing("u1", "artist-1")).toBe(true);
  });

  it("is idempotent — following twice reports no change", () => {
    followStorage.set("u1", "artist-1", true);
    expect(followStorage.set("u1", "artist-1", true)).toBe(false);
  });

  it("unfollows and reports change", () => {
    followStorage.set("u1", "artist-1", true);
    const changed = followStorage.set("u1", "artist-1", false);
    expect(changed).toBe(true);
    expect(followStorage.isFollowing("u1", "artist-1")).toBe(false);
  });

  it("keeps relations isolated per follower", () => {
    followStorage.set("u1", "artist-1", true);
    expect(followStorage.isFollowing("u2", "artist-1")).toBe(false);
  });
});
