import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type {
  Album,
  ArtistProfile,
  HomeFeed,
  PaginatedResponse,
  Playlist,
  Track,
  User,
} from "@/types";

export interface AlbumWithTracks extends Album {
  tracks: Track[];
}

export interface ArtistPage {
  profile: ArtistProfile;
  albums: Album[];
  singles: Track[];
  isFollowing: boolean;
}

export interface PlaylistWithTracks extends Playlist {
  tracks: Track[];
}

export interface StreamResult {
  /** False when the play was too short to count towards analytics or quota. */
  counted: boolean;
  streamsToday: number;
  /** Null on unlimited plans. */
  dailyLimit: number | null;
  remaining: number | null;
}

export const musicService = {
  getHomeFeed(): Promise<HomeFeed> {
    return apiClient<HomeFeed>(endpoints.home.feed, { method: "GET" });
  },

  /**
   * Search across track titles, artist names and album titles.
   * Sorting and the early-access embargo are both applied server-side.
   */
  searchTracks(
    query: string,
    sort: "listeners" | "date" = "listeners",
    page = 1,
  ): Promise<PaginatedResponse<Track>> {
    return apiClient<PaginatedResponse<Track>>(endpoints.tracks.list, {
      method: "GET",
      query: { q: query, sort, page },
    });
  },

  getAlbums(query = ""): Promise<Album[]> {
    return apiClient<PaginatedResponse<Album>>(endpoints.albums.list, {
      method: "GET",
      query: { q: query, pageSize: 100 },
    }).then((response) => response.data);
  },

  getAlbum(id: string): Promise<AlbumWithTracks> {
    return apiClient<AlbumWithTracks>(endpoints.albums.byId(id), {
      method: "GET",
    });
  },

  getTrack(id: string): Promise<Track> {
    return apiClient<Track>(endpoints.tracks.byId(id), { method: "GET" });
  },

  getArtist(id: string): Promise<ArtistPage> {
    return apiClient<ArtistPage>(endpoints.artists.byId(id), { method: "GET" });
  },

  setFollowingArtist(
    artistId: string,
    follow: boolean,
  ): Promise<{ isFollowing: boolean; currentUser: User; target: User }> {
    return apiClient(endpoints.artists.follow(artistId), {
      method: follow ? "POST" : "DELETE",
    });
  },

  /**
   * Record a play. The server enforces the plan's daily cap and returns how
   * much of today's allowance is left, so the UI never has to guess.
   */
  recordStream(trackId: string, secondsPlayed: number): Promise<StreamResult> {
    return apiClient<StreamResult>(endpoints.tracks.stream(trackId), {
      method: "POST",
      body: { secondsPlayed: Math.floor(secondsPlayed) },
    });
  },

  getRecentlyPlayed(): Promise<Track[]> {
    return apiClient<Track[]>(endpoints.me.recentlyPlayed, { method: "GET" });
  },
};

export const playlistService = {
  getPlaylists(): Promise<Playlist[]> {
    return apiClient<Playlist[]>(endpoints.playlists.root, { method: "GET" });
  },

  getPlaylist(playlistId: string): Promise<PlaylistWithTracks> {
    return apiClient<PlaylistWithTracks>(endpoints.playlists.byId(playlistId), {
      method: "GET",
    });
  },

  /** Rejected with `PLAYLIST_LIMIT_REACHED` once the tier quota is spent. */
  createPlaylist(name: string): Promise<Playlist> {
    return apiClient<Playlist>(endpoints.playlists.root, {
      method: "POST",
      body: { name },
    });
  },

  renamePlaylist(playlistId: string, name: string): Promise<Playlist> {
    return apiClient<Playlist>(endpoints.playlists.byId(playlistId), {
      method: "PATCH",
      body: { name },
    });
  },

  async deletePlaylist(playlistId: string): Promise<void> {
    await apiClient<void>(endpoints.playlists.byId(playlistId), {
      method: "DELETE",
    });
  },

  addTrackToPlaylist(
    playlistId: string,
    trackId: string,
  ): Promise<PlaylistWithTracks> {
    return apiClient<PlaylistWithTracks>(endpoints.playlists.tracks(playlistId), {
      method: "POST",
      body: { trackId },
    });
  },

  removeTrackFromPlaylist(
    playlistId: string,
    trackId: string,
  ): Promise<PlaylistWithTracks> {
    return apiClient<PlaylistWithTracks>(
      endpoints.playlists.track(playlistId, trackId),
      { method: "DELETE" },
    );
  },
};
