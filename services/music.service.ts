import {
  mockHomeFeed,
  mockTracks,
  mockAlbums,
  getTrackById,
  getAlbumById,
  getAlbumTracks,
  getArtistById,
} from "@/lib/mock-data";
import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { backendCapabilities } from "@/config/backend";
import { authMockStorage } from "@/lib/auth-mock-storage";
import { followStorage } from "@/lib/follow-storage";
import { playlistStorage } from "@/lib/playlist-storage";
import { canCreatePlaylist } from "@/config/subscription";
import { delay, shouldUseBackend } from "@/lib/service-utils";
import type {
  Album,
  HomeFeed,
  PaginatedResponse,
  Playlist,
  Track,
  User,
} from "@/types";

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

  /** GET /artists/:id — ArtistProfile + albums[] + singles[] + follow state */
  async getArtist(id: string, viewerId?: string) {
    await delay(200);
    const artist = getArtistById(id);
    if (!artist) throw new Error("Artist not found");
    const albums = mockAlbums.filter((a) => a.artistId === id);
    const singles = mockTracks.filter(
      (t) => t.artistId === id && t.albumId === null,
    );
    const isFollowing = viewerId
      ? followStorage.isFollowing(viewerId, id)
      : false;
    return {
      ...artist,
      albums,
      singles,
      isFollowing,
      followersCount: artist.followersCount + (isFollowing ? 1 : 0),
    };
  },

  /** POST|DELETE /artists/:id/follow */
  async setFollowingArtist(
    userId: string,
    artistId: string,
    follow: boolean,
  ): Promise<{ isFollowing: boolean; followersCount: number; currentUser?: User }> {
    await delay(250);
    const artist = getArtistById(artistId);
    if (!artist) throw new Error("Artist not found");

    const changed = followStorage.set(userId, artistId, follow);
    let currentUser: User | undefined;
    if (changed) {
      const user = authMockStorage.findById(userId);
      if (user) {
        currentUser = authMockStorage.updateUser(userId, {
          followingCount: Math.max(
            0,
            user.followingCount + (follow ? 1 : -1),
          ),
        });
      }
    }

    return {
      isFollowing: follow,
      followersCount: artist.followersCount + (follow ? 1 : 0),
      currentUser,
    };
  },

  /** POST /tracks/:id/stream — backend enforces daily stream limits by tier */
  async recordStream(trackId: string, durationPlayed: number): Promise<void> {
    void trackId;
    void durationPlayed;
    await delay(100);
  },
};

function resolvePlaylistTracks(playlist: Playlist): Track[] {
  return playlist.trackIds
    .map((id) => getTrackById(id))
    .filter((t): t is Track => t !== undefined);
}

export const playlistService = {
  /** GET /playlists — current user's playlists */
  async getPlaylists(userId: string): Promise<Playlist[]> {
    await delay(200);
    return playlistStorage.getForUser(userId);
  },

  /** GET /playlists/:id — details + resolved tracks */
  async getPlaylist(userId: string, playlistId: string) {
    await delay(200);
    const playlist = playlistStorage.getById(userId, playlistId);
    if (!playlist) throw new Error("PLAYLIST_NOT_FOUND");
    return { ...playlist, tracks: resolvePlaylistTracks(playlist) };
  },

  /** POST /playlists — backend enforces maxPlaylists by subscription tier */
  async createPlaylist(userId: string, name: string): Promise<Playlist> {
    await delay(300);
    const tier = authMockStorage.findById(userId)?.subscription ?? "free";
    const current = playlistStorage.getForUser(userId).length;
    if (!canCreatePlaylist(tier, current)) {
      throw new Error("PLAYLIST_LIMIT_REACHED");
    }
    return playlistStorage.create(userId, name);
  },

  /** PATCH /playlists/:id — rename */
  async renamePlaylist(
    userId: string,
    playlistId: string,
    name: string,
  ): Promise<Playlist> {
    await delay(250);
    return playlistStorage.rename(userId, playlistId, name);
  },

  /** DELETE /playlists/:id */
  async deletePlaylist(userId: string, playlistId: string): Promise<void> {
    await delay(250);
    playlistStorage.remove(userId, playlistId);
  },

  /** POST /playlists/:id/tracks — { trackId } */
  async addTrackToPlaylist(
    userId: string,
    playlistId: string,
    trackId: string,
  ): Promise<Playlist> {
    await delay(200);
    return playlistStorage.setTrack(userId, playlistId, trackId, true);
  },

  /** DELETE /playlists/:id/tracks/:trackId */
  async removeTrackFromPlaylist(
    userId: string,
    playlistId: string,
    trackId: string,
  ): Promise<Playlist> {
    await delay(200);
    return playlistStorage.setTrack(userId, playlistId, trackId, false);
  },
};
