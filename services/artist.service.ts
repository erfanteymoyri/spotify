import { apiClient, toFormData } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type {
  ArtistAlbum,
  ArtistAlbumInput,
  ArtistPayout,
  ArtistWork,
  ArtistWorkInput,
} from "@/types";

export interface ArtistAnalytics {
  totalStreams: number;
  totalListeners: number;
  trackCount: number;
  albumCount: number;
  followersCount: number;
  revenue: number;
}

/** Files the upload dialog collects alongside the metadata. */
export interface ArtistWorkFiles {
  audio?: File | null;
  cover?: File | null;
}

export const artistService = {
  getWorks(): Promise<ArtistWork[]> {
    return apiClient<ArtistWork[]>(endpoints.artist.works, { method: "GET" });
  },

  /**
   * Multipart upload: the audio file, an optional cover, and the metadata.
   * Choosing `releaseType: "album"` makes the server create the album.
   */
  uploadWork(input: ArtistWorkInput, files: ArtistWorkFiles): Promise<ArtistWork> {
    const form = toFormData({
      title: input.title,
      releaseType: input.releaseType,
      genre: input.genre,
      releaseYear: input.releaseYear,
      lyrics: input.lyrics,
      duration: input.duration,
      collaborators: input.collaborators,
      // Present only when publishing into an album that already exists; the
      // server creates one otherwise.
      albumId: input.albumId ?? undefined,
      audio: files.audio ?? undefined,
      cover: files.cover ?? undefined,
    });

    return apiClient<ArtistWork>(endpoints.artist.tracks, {
      method: "POST",
      body: form,
    });
  },

  /**
   * Metadata only — the audio file is immutable by design, since analytics,
   * playlists and payouts all reference the existing recording.
   */
  updateWork(
    id: string,
    patch: Partial<Omit<ArtistWorkInput, "releaseType">>,
  ): Promise<ArtistWork> {
    return apiClient<ArtistWork>(endpoints.artist.trackById(id), {
      method: "PATCH",
      body: patch,
    });
  },

  async deleteWork(id: string): Promise<void> {
    await apiClient<void>(endpoints.artist.trackById(id), { method: "DELETE" });
  },

  // --- Albums -------------------------------------------------------------
  //
  // Every mutation resolves to the whole album, tracklist included, so the
  // caller re-renders from the server's answer instead of patching its local
  // copy — track numbers shift on the server whenever membership changes, and
  // a client-side guess at the new order would go stale immediately.

  getAlbums(): Promise<ArtistAlbum[]> {
    return apiClient<ArtistAlbum[]>(endpoints.artist.albums, { method: "GET" });
  },

  createAlbum(input: ArtistAlbumInput, cover?: File | null): Promise<ArtistAlbum> {
    return apiClient<ArtistAlbum>(endpoints.artist.albums, {
      method: "POST",
      body: toFormData({ ...input, cover: cover ?? undefined }),
    });
  },

  updateAlbum(
    id: string,
    patch: Partial<ArtistAlbumInput>,
    cover?: File | null,
  ): Promise<ArtistAlbum> {
    return apiClient<ArtistAlbum>(endpoints.artist.albumById(id), {
      method: "PATCH",
      body: toFormData({ ...patch, cover: cover ?? undefined }),
    });
  },

  /** Removes the album only; its tracks survive as singles. */
  async deleteAlbum(id: string): Promise<void> {
    await apiClient<void>(endpoints.artist.albumById(id), { method: "DELETE" });
  },

  addTrackToAlbum(albumId: string, trackId: string): Promise<ArtistAlbum> {
    return apiClient<ArtistAlbum>(endpoints.artist.albumTracks(albumId), {
      method: "POST",
      body: { trackId },
    });
  },

  removeTrackFromAlbum(albumId: string, trackId: string): Promise<ArtistAlbum> {
    return apiClient<ArtistAlbum>(endpoints.artist.albumTrack(albumId, trackId), {
      method: "DELETE",
    });
  },

  reorderAlbum(albumId: string, trackIds: string[]): Promise<ArtistAlbum> {
    return apiClient<ArtistAlbum>(endpoints.artist.albumOrder(albumId), {
      method: "PATCH",
      body: { trackIds },
    });
  },

  getAnalytics(): Promise<ArtistAnalytics> {
    return apiClient<ArtistAnalytics>(endpoints.artist.analytics, {
      method: "GET",
    });
  },

  getPayouts(): Promise<ArtistPayout[]> {
    return apiClient<ArtistPayout[]>(endpoints.artist.payouts, { method: "GET" });
  },
};
