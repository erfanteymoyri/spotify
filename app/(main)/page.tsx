"use client";

import { AlbumCard } from "@/components/cards/album-card";
import { PlaylistCard } from "@/components/cards/playlist-card";
import { TrackCard } from "@/components/cards/track-card";
import { SectionHeader } from "@/components/shared/section-header";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/hooks/use-translation";
import { useHomeFeed } from "@/queries/use-home-feed";

export default function HomePage() {
  const { data, loading, error } = useHomeFeed();
  const { user } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-destructive">{error ?? t("common.error")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-4">
      <SectionHeader
        title={t("home.greeting", { name: user?.displayName ?? "" })}
        subtitle={t("home.subtitle")}
      />

      <section>
        <SectionHeader title={t("home.recentlyPlayed")} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {data.recentlyPlayedPlaylists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title={t("home.latestAlbums")} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {data.latestAlbums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title={t("home.popularTracks")} />
        <div className="space-y-1">
          {data.popularTracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              queue={data.popularTracks}
            />
          ))}
        </div>
      </section>

      {user?.subscription === "gold" && data.earlyAccessTracks && (
        <section>
          <SectionHeader
            title={t("home.earlyAccess")}
            subtitle={t("home.earlyAccessSubtitle")}
          />
          <div className="space-y-1">
            {data.earlyAccessTracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
