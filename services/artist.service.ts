import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { backendCapabilities } from "@/config/backend";
import { artistWorksStorage } from "@/lib/artist-works-storage";
import { delay, shouldUseBackend } from "@/lib/service-utils";
import type { ArtistWork, ArtistWorkInput } from "@/types";

export const artistService = {
  /** GET /artist/works — the signed-in artist's published works */
  async getWorks(): Promise<ArtistWork[]> {
    if (shouldUseBackend(backendCapabilities.artist.works)) {
      return apiClient<ArtistWork[]>(endpoints.artist.works, { method: "GET" });
    }

    await delay(300);
    return artistWorksStorage.getWorks();
  },

  /** POST /artist/tracks — multipart upload (audio, cover, metadata) */
  async uploadWork(input: ArtistWorkInput): Promise<ArtistWork> {
    if (shouldUseBackend(backendCapabilities.artist.upload)) {
      return apiClient<ArtistWork>(endpoints.artist.uploadTrack, {
        method: "POST",
        body: input,
      });
    }

    await delay(500);
    return artistWorksStorage.createWork(input);
  },

  /** PATCH /artist/tracks/:id — edit metadata of a published work */
  async updateWork(
    id: string,
    patch: Partial<ArtistWorkInput>,
  ): Promise<ArtistWork | undefined> {
    if (shouldUseBackend(backendCapabilities.artist.upload)) {
      return apiClient<ArtistWork>(endpoints.artist.updateTrack(id), {
        method: "PATCH",
        body: patch,
      });
    }

    await delay(300);
    return artistWorksStorage.updateWork(id, patch);
  },

  /** DELETE /artist/tracks/:id */
  async deleteWork(id: string): Promise<void> {
    if (shouldUseBackend(backendCapabilities.artist.upload)) {
      await apiClient<void>(endpoints.artist.deleteTrack(id), {
        method: "DELETE",
      });
      return;
    }

    await delay(300);
    artistWorksStorage.deleteWork(id);
  },
};
