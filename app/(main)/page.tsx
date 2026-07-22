"use client";

import { AlbumCard } from "@/components/cards/album-card";
import { PlaylistCard } from "@/components/cards/playlist-card";
import { TrackCard } from "@/components/cards/track-card";
import { HomeFeedSection } from "@/components/home/home-feed-section";
import { Avatar } from "@/ui/avatar";
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
      {/* Display name + profile picture (default fallback handled by Avatar) */}
      <div className="relative flex items-center gap-5 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-l from-primary/20 via-primary/5 to-transparent p-5 sm:p-7">
        <div className="pointer-events-none absolute -top-16 -left-16 size-48 rounded-full bg-primary/10 blur-3xl" />
        <Avatar
          src={user?.avatarUrl}
          alt={user?.displayName ?? t("home.guest")}
          size="md"
          className="size-14 shadow-lg ring-2 ring-primary/30 sm:size-16"
        />
        <div className="relative">
          <p className="text-sm leading-6 text-muted-foreground">
            {t("common.welcome")}
          </p>
          <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
            {user?.displayName ?? t("home.guest")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("home.subtitle")}
          </p>
        </div>
      </div>

      <HomeFeedSection
        title={t("home.recentlyPlayed")}
        items={data.recentlyPlayedPlaylists}
        emptyTitle={t("home.emptyPlaylistsTitle")}
        emptyDescription={t("home.emptyPlaylistsDescription")}
        renderItem={(playlist) => (
          <PlaylistCard key={playlist.id} playlist={playlist} />
        )}
      />

      <HomeFeedSection
        title={t("home.latestAlbums")}
        items={data.latestAlbums}
        emptyTitle={t("home.emptyAlbumsTitle")}
        emptyDescription={t("home.emptyAlbumsDescription")}
        renderItem={(album) => <AlbumCard key={album.id} album={album} />}
      />

      <HomeFeedSection
        title={t("home.popularTracks")}
        items={data.popularTracks}
        emptyTitle={t("home.emptyTracksTitle")}
        emptyDescription={t("home.emptyTracksDescription")}
        layout="list"
        renderItem={(track) => (
          <TrackCard
            key={track.id}
            track={track}
            queue={data.popularTracks}
          />
        )}
      />

      {user?.subscription === "gold" && (
        <HomeFeedSection
          title={t("home.earlyAccess")}
          subtitle={t("home.earlyAccessSubtitle")}
          items={data.earlyAccessTracks ?? []}
          emptyTitle={t("home.emptyEarlyAccessTitle")}
          emptyDescription={t("home.emptyEarlyAccessDescription")}
          layout="list"
          className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5"
          renderItem={(track) => <TrackCard key={track.id} track={track} />}
        />
      )}
    </div>
  );
}
