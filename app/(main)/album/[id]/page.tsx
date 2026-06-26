"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { TrackCard } from "@/components/cards/track-card";
import { SectionHeader } from "@/components/shared/section-header";
import { useTranslation } from "@/hooks/use-translation";
import { musicService } from "@/services/music.service";
import type { Track } from "@/types";

export default function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [album, setAlbum] = useState<{
    title: string;
    artistName: string;
    coverUrl: string;
    tracks: Track[];
  } | null>(null);

  useEffect(() => {
    if (id) {
      musicService.getAlbum(id).then(setAlbum);
    }
  }, [id]);

  if (!album) {
    return (
      <p className="py-20 text-center text-muted-foreground">
        {t("common.loading")}
      </p>
    );
  }

  return (
    <div className="space-y-8 py-4">
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative size-48 shrink-0 overflow-hidden rounded-lg shadow-2xl">
          <Image
            src={album.coverUrl}
            alt={album.title}
            fill
            className="object-cover"
            priority
          />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t("common.album")}</p>
          <h1 className="text-4xl font-bold">{album.title}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{album.artistName}</p>
        </div>
      </div>

      <section>
        <SectionHeader title={t("album.trackList")} />
        <div className="space-y-1">
          {album.tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              queue={album.tracks}
              showAlbum={false}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
