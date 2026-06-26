"use client";

import { useEffect, useState } from "react";
import { AlbumCard } from "@/components/cards/album-card";
import { TrackCard } from "@/components/cards/track-card";
import { SectionHeader } from "@/components/shared/section-header";
import { useTranslation } from "@/hooks/use-translation";
import { Input } from "@/ui/input";
import { musicService } from "@/services/music.service";
import type { Album, Track } from "@/types";
import { Search } from "lucide-react";

export default function LibraryPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"listeners" | "date">("listeners");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      musicService.searchTracks(query, sort),
      musicService.getAlbums(),
    ])
      .then(([trackResult, albumList]) => {
        setTracks(trackResult.data);
        setAlbums(albumList);
      })
      .finally(() => setLoading(false));
  }, [query, sort]);

  return (
    <div className="space-y-8 py-4">
      <SectionHeader
        title={t("library.title")}
        subtitle={t("library.subtitle")}
      />

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("library.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "listeners" | "date")}
          className="h-10 rounded-lg border border-input bg-background/50 px-3 text-sm"
        >
          <option value="listeners">{t("library.sortListeners")}</option>
          <option value="date">{t("library.sortDate")}</option>
        </select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <>
          <section>
            <SectionHeader title={t("common.albums")} />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          </section>

          <section>
            <SectionHeader title={t("common.singles")} />
            <div className="space-y-1">
              {tracks.map((track) => (
                <TrackCard key={track.id} track={track} queue={tracks} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
