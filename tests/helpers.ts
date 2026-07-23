import type { Track } from "@/types";

/** Build a fully-typed Track with sensible defaults; override any field. */
export function makeTrack(id: string, overrides: Partial<Track> = {}): Track {
  return {
    id,
    title: `Track ${id}`,
    artistId: "artist-1",
    artistName: "Artist",
    albumId: null,
    albumName: null,
    coverUrl: "/cover.jpg",
    audioUrl: `/audio/${id}.mp3`,
    duration: 200,
    publishedAt: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

/** Convenience: build an ordered queue track-1..track-n. */
export function makeQueue(n: number): Track[] {
  return Array.from({ length: n }, (_, i) => makeTrack(`track-${i + 1}`));
}
