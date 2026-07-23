"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AlbumCard } from "@/components/cards/album-card";
import { TrackCard } from "@/components/cards/track-card";
import { AddToPlaylistMenu } from "@/components/playlists/add-to-playlist-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { FadeIn, Stagger, StaggerItem } from "@/components/shared/motion";
import { SectionHeader } from "@/components/shared/section-header";
import { useTranslation } from "@/hooks/use-translation";
import { Input } from "@/ui/input";
import { musicService } from "@/services/music.service";
import type { Album, Track } from "@/types";

type SortMode = "listeners" | "date";

export default function LibraryPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("listeners");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setLoading(true);
  };

  const handleSortChange = (value: SortMode) => {
    setSort(value);
    setLoading(true);
  };

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      musicService.searchTracks(query, sort),
      musicService.getAlbums(),
    ])
      .then(([trackResult, albumList]) => {
        if (cancelled) return;
        setTracks(trackResult.data);
        setAlbums(albumList);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, sort]);

  // Albums honor the same search & sort criteria as tracks (spec 2.8)
  const visibleAlbums = useMemo(() => {
    const q = query.trim();
    const filtered = albums.filter(
      (a) => q === "" || a.title.includes(q) || a.artistName.includes(q),
    );
    if (sort === "date") {
      return [...filtered].sort(
        (a, b) =>
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime(),
      );
    }
    return filtered;
  }, [albums, query, sort]);

  const noResults = !loading && visibleAlbums.length === 0 && tracks.length === 0;

  return (
    <FadeIn className="space-y-8 py-4">
      <SectionHeader
        title={t("library.title")}
        subtitle={t("library.subtitle")}
      />

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("library.searchPlaceholder")}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="pe-10"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value as SortMode)}
          className="h-10 rounded-lg border border-input bg-background/50 px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <option value="listeners">{t("library.sortListeners")}</option>
          <option value="date">{t("library.sortDate")}</option>
        </select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : noResults ? (
        <EmptyState
          title={t("library.noResults")}
          description={t("library.noResultsHint")}
        />
      ) : (
        <>
          {visibleAlbums.length > 0 && (
            <section>
              <SectionHeader title={t("common.albums")} />
              <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {visibleAlbums.map((album) => (
                  <StaggerItem key={album.id}>
                    <AlbumCard album={album} />
                  </StaggerItem>
                ))}
              </Stagger>
            </section>
          )}

          {tracks.length > 0 && (
            <section>
              <SectionHeader title={t("common.singles")} />
              <Stagger className="space-y-1">
                {tracks.map((track) => (
                  <StaggerItem key={track.id}>
                    <TrackCard
                      track={track}
                      queue={tracks}
                      actions={<AddToPlaylistMenu trackId={track.id} />}
                    />
                  </StaggerItem>
                ))}
              </Stagger>
            </section>
          )}
        </>
      )}
    </FadeIn>
  );
}
