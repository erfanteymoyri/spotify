"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { AlbumCard } from "@/components/cards/album-card";
import { TrackCard } from "@/components/cards/track-card";
import { FadeIn, Stagger, StaggerItem } from "@/components/shared/motion";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { musicService, type ArtistPage } from "@/services/music.service";
import { useAuthStore } from "@/stores/auth-store";
import { formatNumber } from "@/lib/format";

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const { t } = useTranslation();
  const [artist, setArtist] = useState<ArtistPage | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    if (id) {
      musicService.getArtist(id).then(setArtist);
    }
  }, [id]);

  const handleToggleFollow = async () => {
    if (!userId || !artist || followLoading) return;
    setFollowLoading(true);
    try {
      const result = await musicService.setFollowingArtist(
        id,
        !artist.isFollowing,
      );
      setArtist((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: result.isFollowing,
              profile: {
                ...prev.profile,
                followersCount: result.target.followersCount,
              },
            }
          : prev,
      );
      updateUser(result.currentUser);
    } finally {
      setFollowLoading(false);
    }
  };

  if (!artist) {
    return (
      <p className="py-20 text-center text-muted-foreground">
        {t("common.loading")}
      </p>
    );
  }

  const { profile } = artist;
  // The API returns these as null unless the viewer is entitled to them
  // (gold tier, the artist themselves, or staff) — spec 2.4.
  const showStats =
    profile.totalListeners != null || profile.totalStreams != null;

  return (
    <FadeIn className="space-y-8 py-4">
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-l from-primary/15 via-primary/5 to-transparent p-6 sm:p-8">
        <div className="pointer-events-none absolute -top-20 -left-20 size-56 rounded-full bg-primary/10 blur-3xl animate-[float_10s_ease-in-out_infinite]" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-bold">{profile.stageName}</h1>
            {profile.isVerified && (
              <BadgeCheck
                className="size-7 text-primary"
                aria-label={t("artist.verified")}
              />
            )}
          </div>
          <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
            {profile.bio}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {formatNumber(profile.followersCount)} {t("profile.followers")}
          </p>
          <Button
            variant={artist.isFollowing ? "outline" : "default"}
            className="mt-4"
            size="sm"
            disabled={followLoading}
            onClick={handleToggleFollow}
          >
            {followLoading
              ? t("common.loading")
              : artist.isFollowing
                ? t("common.unfollow")
                : t("common.follow")}
          </Button>
        </div>
      </div>

      {showStats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat label={t("artist.listeners")} value={profile.totalListeners} />
          <Stat label={t("artist.streams")} value={profile.totalStreams} />
        </div>
      )}

      {artist.albums.length > 0 && (
        <section>
          <SectionHeader title={t("common.albums")} />
          <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {artist.albums.map((album) => (
              <StaggerItem key={album.id}>
                <AlbumCard album={album} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      {artist.singles.length > 0 && (
        <section>
          <SectionHeader title={t("common.singles")} />
          <div className="space-y-1">
            {artist.singles.map((track) => (
              <TrackCard key={track.id} track={track} queue={artist.singles} />
            ))}
          </div>
        </section>
      )}
    </FadeIn>
  );
}

function Stat({ label, value }: { label: string; value?: number | null }) {
  if (value == null) return null;
  return (
    <div className="rounded-xl bg-card/40 p-4 text-center">
      <p className="text-2xl font-bold">{formatNumber(value)}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
