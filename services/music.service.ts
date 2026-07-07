import {
  mockHomeFeed,
  mockPlaylists,
  mockTracks,
  mockAlbums,
  getTrackById,
  getAlbumById,
  getAlbumTracks,
  getArtistById,
  getPlaylistById,
  getPlaylistTracks,
} from "@/lib/mock-data";
import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { backendCapabilities } from "@/config/backend";
import { delay, shouldUseBackend } from "@/lib/service-utils";
import type { Album, HomeFeed, PaginatedResponse, Track } from "@/types";

export const musicService = {
  /** GET /home — recentlyPlayedPlaylists, latestAlbums, popularTracks */
  async getHomeFeed(): Promise<HomeFeed> {
    if (shouldUseBackend(backendCapabilities.home.feed)) {
      return apiClient<HomeFeed>(endpoints.home.feed, { method: "GET" });
    }

    await delay(300);
    return mockHomeFeed;
  },

  /** GET /tracks/search?q=&sort=listeners|date */
  async searchTracks(
    query: string,
    sort: "listeners" | "date" = "listeners",
  ): Promise<PaginatedResponse<Track>> {
    await delay(300);
    const filtered = mockTracks.filter(
      (t) =>
        t.title.includes(query) ||
        t.artistName.includes(query) ||
        query === "",
    );
    const sorted = [...filtered].sort((a, b) =>
      sort === "listeners"
        ? (b.listenersCount ?? 0) - (a.listenersCount ?? 0)
        : new Date(b.publishedAt).getTime() -
          new Date(a.publishedAt).getTime(),
    );
    return { data: sorted, total: sorted.length, page: 1, pageSize: 20 };
  },

  /** GET /albums */
  async getAlbums(): Promise<Album[]> {
    await delay(200);
    return mockAlbums;
  },

  /** GET /albums/:id */
  async getAlbum(id: string) {
    await delay(200);
    const album = getAlbumById(id);
    if (!album) throw new Error("Album not found");
    return { ...album, tracks: getAlbumTracks(id) };
  },

  /** GET /tracks/:id */
  async getTrack(id: string): Promise<Track> {
    await delay(200);
    const track = getTrackById(id);
    if (!track) throw new Error("Track not found");
    return track;
  },

  /** GET /artists/:id — ArtistProfile + albums[] + singles[] */
  async getArtist(id: string) {
    await delay(200);
    const artist = getArtistById(id);
    if (!artist) throw new Error("Artist not found");
    const albums = mockAlbums.filter((a) => a.artistId === id);
    const singles = mockTracks.filter(
      (t) => t.artistId === id && t.albumId === null,
    );
    return { ...artist, albums, singles };
  },

  /** POST /tracks/:id/stream — backend enforces daily stream limits by tier */
  async recordStream(trackId: string, durationPlayed: number): Promise<void> {
    void trackId;
    void durationPlayed;
    await delay(100);
  },
};

export const playlistService = {
  /** GET /playlists */
  async getPlaylists() {
    await delay(200);
    return mockPlaylists;
  },

  /** GET /playlists/:id */
  async getPlaylist(id: string) {
    await delay(200);
    const playlist = getPlaylistById(id);
    if (!playlist) throw new Error("Playlist not found");
    return { ...playlist, tracks: getPlaylistTracks(id) };
  },

  /** POST /playlists — backend enforces maxPlaylists by subscription tier */
  async createPlaylist(name: string) {
    await delay(300);
    return {
      id: `playlist-${Date.now()}`,
      name,
      ownerId: "user-1",
      coverUrl: null,
      trackIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  /** POST /playlists/:id/tracks */
  async addTrackToPlaylist(playlistId: string, trackId: string) {
    void playlistId;
    void trackId;
    await delay(200);
  },
};
