import { createId, readJson, writeJson } from "@/lib/local-store";
import { mockPlaylists } from "@/lib/mock-data";
import type { Playlist } from "@/types";

const PLAYLISTS_KEY = "spotify-playlists";

/** ownerId -> playlists, persisted in Local Storage for phase 1 */
type PlaylistMap = Record<string, Playlist[]>;

function readAll(): PlaylistMap {
  return readJson<PlaylistMap>(PLAYLISTS_KEY, {});
}

function writeForUser(userId: string, playlists: Playlist[]): void {
  const all = readAll();
  all[userId] = playlists;
  writeJson(PLAYLISTS_KEY, all);
}

export const playlistStorage = {
  /** First access seeds the demo playlists for that user */
  getForUser(userId: string): Playlist[] {
    const all = readAll();
    if (!all[userId]) {
      all[userId] = mockPlaylists.map((p) => ({ ...p, ownerId: userId }));
      writeJson(PLAYLISTS_KEY, all);
    }
    return all[userId];
  },

  getById(userId: string, playlistId: string): Playlist | undefined {
    return this.getForUser(userId).find((p) => p.id === playlistId);
  },

  create(userId: string, name: string): Playlist {
    const playlists = this.getForUser(userId);
    const now = new Date().toISOString();
    const playlist: Playlist = {
      id: createId("playlist"),
      name,
      ownerId: userId,
      coverUrl: null,
      trackIds: [],
      createdAt: now,
      updatedAt: now,
    };
    writeForUser(userId, [...playlists, playlist]);
    return playlist;
  },

  rename(userId: string, playlistId: string, name: string): Playlist {
    const playlists = this.getForUser(userId);
    const index = playlists.findIndex((p) => p.id === playlistId);
    if (index === -1) throw new Error("PLAYLIST_NOT_FOUND");

    const updated: Playlist = {
      ...playlists[index],
      name,
      updatedAt: new Date().toISOString(),
    };
    playlists[index] = updated;
    writeForUser(userId, playlists);
    return updated;
  },

  remove(userId: string, playlistId: string): void {
    writeForUser(
      userId,
      this.getForUser(userId).filter((p) => p.id !== playlistId),
    );
  },

  /** Add or remove a track; used by the playlist menus in the library (spec 2.8) */
  setTrack(
    userId: string,
    playlistId: string,
    trackId: string,
    present: boolean,
  ): Playlist {
    const playlists = this.getForUser(userId);
    const index = playlists.findIndex((p) => p.id === playlistId);
    if (index === -1) throw new Error("PLAYLIST_NOT_FOUND");

    const trackIds = playlists[index].trackIds.filter((id) => id !== trackId);
    if (present) trackIds.push(trackId);

    const updated: Playlist = {
      ...playlists[index],
      trackIds,
      updatedAt: new Date().toISOString(),
    };
    playlists[index] = updated;
    writeForUser(userId, playlists);
    return updated;
  },
};
