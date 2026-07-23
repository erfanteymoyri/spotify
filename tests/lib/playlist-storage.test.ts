import { beforeEach, describe, expect, it } from "vitest";
import { playlistStorage } from "@/lib/playlist-storage";

beforeEach(() => localStorage.clear());

describe("playlistStorage", () => {
  it("seeds demo playlists owned by the requesting user", () => {
    const lists = playlistStorage.getForUser("user-1");
    expect(lists.length).toBeGreaterThan(0);
    expect(lists.every((p) => p.ownerId === "user-1")).toBe(true);
  });

  it("isolates playlists between users", () => {
    playlistStorage.getForUser("user-1");
    const created = playlistStorage.create("user-1", "Mine");
    const otherLists = playlistStorage.getForUser("user-2");
    expect(otherLists.find((p) => p.id === created.id)).toBeUndefined();
  });

  it("creates an empty playlist", () => {
    const created = playlistStorage.create("user-1", "Road Trip");
    expect(created.name).toBe("Road Trip");
    expect(created.trackIds).toEqual([]);
    expect(playlistStorage.getById("user-1", created.id)).toBeDefined();
  });

  it("renames a playlist", () => {
    const created = playlistStorage.create("user-1", "Old");
    const renamed = playlistStorage.rename("user-1", created.id, "New");
    expect(renamed.name).toBe("New");
    expect(playlistStorage.getById("user-1", created.id)?.name).toBe("New");
  });

  it("removes a playlist", () => {
    const created = playlistStorage.create("user-1", "Temp");
    playlistStorage.remove("user-1", created.id);
    expect(playlistStorage.getById("user-1", created.id)).toBeUndefined();
  });

  it("adds and removes a track without duplicating", () => {
    const created = playlistStorage.create("user-1", "Mix");
    playlistStorage.setTrack("user-1", created.id, "track-1", true);
    playlistStorage.setTrack("user-1", created.id, "track-1", true); // again
    let list = playlistStorage.getById("user-1", created.id);
    expect(list?.trackIds).toEqual(["track-1"]);

    playlistStorage.setTrack("user-1", created.id, "track-1", false);
    list = playlistStorage.getById("user-1", created.id);
    expect(list?.trackIds).toEqual([]);
  });

  it("throws when renaming a missing playlist", () => {
    expect(() => playlistStorage.rename("user-1", "nope", "X")).toThrow();
  });
});
