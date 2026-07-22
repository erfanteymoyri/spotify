import { calculateArtistReward } from "@/lib/rewards";
import { createId, readJson, writeJson } from "@/lib/local-store";
import type { ArtistWork, ArtistWorkInput } from "@/types";

const WORKS_KEY = "spotify-artist-works";

const PLACEHOLDER_COVER =
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop";
const PLACEHOLDER_AUDIO =
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3";

function seedWorks(): ArtistWork[] {
  const listeners = 12_400;
  const streams = 48_900;
  return [
    {
      id: createId("work"),
      title: "ستاره‌ی دنباله‌دار",
      artistId: "artist-1",
      artistName: "سهراب پاکزاد",
      albumId: null,
      albumName: null,
      coverUrl: PLACEHOLDER_COVER,
      audioUrl: PLACEHOLDER_AUDIO,
      duration: 224,
      lyrics: "",
      genre: "پاپ",
      releaseYear: 2025,
      listenersCount: listeners,
      streamsCount: streams,
      publishedAt: "2025-03-12T00:00:00Z",
      releaseType: "single",
      collaborators: [],
      revenue: calculateArtistReward(listeners, streams),
    },
  ];
}

export const artistWorksStorage = {
  getWorks(): ArtistWork[] {
    const stored = readJson<ArtistWork[] | null>(WORKS_KEY, null);
    if (!stored?.length) {
      const seeded = seedWorks();
      writeJson(WORKS_KEY, seeded);
      return seeded;
    }
    return stored;
  },

  createWork(input: ArtistWorkInput): ArtistWork {
    const work: ArtistWork = {
      id: createId("work"),
      title: input.title.trim(),
      artistId: "artist-1",
      artistName: "سهراب پاکزاد",
      albumId: null,
      albumName: null,
      coverUrl: input.coverUrl || PLACEHOLDER_COVER,
      audioUrl: input.audioUrl || PLACEHOLDER_AUDIO,
      duration: 0,
      lyrics: input.lyrics.trim() || null,
      genre: input.genre.trim(),
      releaseYear: input.releaseYear,
      listenersCount: 0,
      streamsCount: 0,
      publishedAt: new Date().toISOString(),
      releaseType: input.releaseType,
      collaborators: input.collaborators,
      revenue: 0,
    };
    writeJson(WORKS_KEY, [work, ...this.getWorks()]);
    return work;
  },

  updateWork(id: string, patch: Partial<ArtistWorkInput>): ArtistWork | undefined {
    const works = this.getWorks().map((work) =>
      work.id === id
        ? {
            ...work,
            ...patch,
            lyrics: patch.lyrics !== undefined ? patch.lyrics : work.lyrics,
          }
        : work,
    );
    writeJson(WORKS_KEY, works);
    return works.find((work) => work.id === id);
  },

  deleteWork(id: string): void {
    writeJson(
      WORKS_KEY,
      this.getWorks().filter((work) => work.id !== id),
    );
  },
};
