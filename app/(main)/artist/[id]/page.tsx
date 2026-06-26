"use client";

import { useEffect, useState } from "react";
import { AlbumCard } from "@/components/cards/album-card";
import { TrackCard } from "@/components/cards/track-card";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { musicService } from "@/services/music.service";
import { useAuth } from "@/contexts/auth-context";
import { formatNumber } from "@/lib/format";
import { BadgeCheck } from "lucide-react";
import { useParams } from "next/navigation";
import type { Album, Track } from "@/types";

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [artist, setArtist] = useState<{
    stageName: string;
    bio: string;
    isVerified: boolean;
    followersCount: number;
    totalListeners?: number;
    totalStreams?: number;
    albums: Album[];
    singles: Track[];
  } | null>(null);

  useEffect(() => {
    if (id) {
      musicService.getArtist(id).then(setArtist);
    }
  }, [id]);

  if (!artist) {
    return (
      <p className="py-20 text-center text-muted-foreground">
        {t("common.loading")}
      </p>
    );
  }

  const showStats =
    user?.subscription === "gold" && artist.isVerified;

  return (
    <div className="space-y-8 py-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-4xl font-bold">{artist.stageName}</h1>
          {artist.isVerified && (
            <BadgeCheck
              className="size-7 text-primary"
              aria-label={t("artist.verified")}
            />
          )}
        </div>
        <p className="mt-4 max-w-2xl text-muted-foreground">{artist.bio}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {formatNumber(artist.followersCount)} {t("profile.followers")}
        </p>
        <Button variant="outline" className="mt-4" size="sm">
          {t("common.follow")}
        </Button>
      </div>

      {showStats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat label={t("artist.listeners")} value={artist.totalListeners} />
          <Stat label={t("artist.streams")} value={artist.totalStreams} />
        </div>
      )}

      <section>
        <SectionHeader title={t("common.albums")} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {artist.albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      </section>

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
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  if (value === undefined) return null;
  return (
    <div className="rounded-xl bg-card/40 p-4 text-center">
      <p className="text-2xl font-bold">{formatNumber(value)}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
