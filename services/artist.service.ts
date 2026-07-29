import { apiClient, toFormData } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { ArtistPayout, ArtistWork, ArtistWorkInput } from "@/types";

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

  getAnalytics(): Promise<ArtistAnalytics> {
    return apiClient<ArtistAnalytics>(endpoints.artist.analytics, {
      method: "GET",
    });
  },

  getPayouts(): Promise<ArtistPayout[]> {
    return apiClient<ArtistPayout[]>(endpoints.artist.payouts, { method: "GET" });
  },
};
