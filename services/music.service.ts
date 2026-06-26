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
import type { Album, HomeFeed, PaginatedResponse, Track } from "@/types";

export const musicService = {
  /**
   * GET /home
   * Response: HomeFeed
   * Includes: recentlyPlayedPlaylists, latestAlbums, popularTracks
   * For gold tier: earlyAccessTracks
   */
  async getHomeFeed(): Promise<HomeFeed> {
    // return apiClient<HomeFeed>(endpoints.home.feed, { method: "GET", token });

    await delay(300);
    return mockHomeFeed;
  },

  /**
   * GET /tracks/search?q=&sort=listeners|date
   * Response: PaginatedResponse<Track>
   */
  async searchTracks(
    query: string,
    sort: "listeners" | "date" = "listeners",
  ): Promise<PaginatedResponse<Track>> {
    // return apiClient(endpoints.tracks.search + `?q=${query}&sort=${sort}`, { method: "GET", token });

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

  /**
   * GET /albums
   */
  async getAlbums(): Promise<Album[]> {
    // return apiClient<Album[]>(endpoints.albums.list, { method: "GET", token });

    await delay(200);
    return mockAlbums;
  },

  /**
   * GET /albums/:id
   */
  async getAlbum(id: string) {
    // return apiClient(endpoints.albums.byId(id), { method: "GET", token });

    await delay(200);
    const album = getAlbumById(id);
    if (!album) throw new Error("Album not found");
    return { ...album, tracks: getAlbumTracks(id) };
  },

  /**
   * GET /tracks/:id
   */
  async getTrack(id: string): Promise<Track> {
    // return apiClient<Track>(endpoints.tracks.byId(id), { method: "GET", token });

    await delay(200);
    const track = getTrackById(id);
    if (!track) throw new Error("Track not found");
    return track;
  },

  /**
   * GET /artists/:id
   * Response: ArtistProfile + albums[] + singles[]
   */
  async getArtist(id: string) {
    // return apiClient(endpoints.artists.byId(id), { method: "GET", token });

    await delay(200);
    const artist = getArtistById(id);
    if (!artist) throw new Error("Artist not found");
    const albums = mockAlbums.filter((a) => a.artistId === id);
    const singles = mockTracks.filter(
      (t) => t.artistId === id && t.albumId === null,
    );
    return { ...artist, albums, singles };
  },

  /**
   * POST /tracks/:id/stream
   * Body: { durationPlayed: number }
   * Backend must enforce daily stream limits (60/100) based on tier
   */
  async recordStream(trackId: string, durationPlayed: number): Promise<void> {
    // return apiClient(endpoints.tracks.stream(trackId), {
    //   method: "POST",
    //   body: { durationPlayed },
    //   token,
    // });

    void trackId;
    void durationPlayed;
    await delay(100);
  },
};

export const playlistService = {
  /**
   * GET /playlists
   */
  async getPlaylists() {
    // return apiClient(endpoints.playlists.list, { method: "GET", token });

    await delay(200);
    return mockPlaylists;
  },

  /**
   * GET /playlists/:id
   */
  async getPlaylist(id: string) {
    // return apiClient(endpoints.playlists.byId(id), { method: "GET", token });

    await delay(200);
    const playlist = getPlaylistById(id);
    if (!playlist) throw new Error("Playlist not found");
    return { ...playlist, tracks: getPlaylistTracks(id) };
  },

  /**
   * POST /playlists — Body: { name: string }
   * Backend must enforce maxPlaylists based on subscription tier
   */
  async createPlaylist(name: string) {
    // return apiClient(endpoints.playlists.create, { method: "POST", body: { name }, token });

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

  /**
   * POST /playlists/:id/tracks — Body: { trackId: string }
   */
  async addTrackToPlaylist(playlistId: string, trackId: string) {
    // return apiClient(endpoints.playlists.addTrack(playlistId), {
    //   method: "POST",
    //   body: { trackId },
    //   token,
    // });

    void playlistId;
    void trackId;
    await delay(200);
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
