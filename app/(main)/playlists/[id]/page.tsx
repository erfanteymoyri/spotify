"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TrackCard } from "@/components/cards/track-card";
import { SectionHeader } from "@/components/shared/section-header";
import { useTranslation } from "@/hooks/use-translation";
import { playlistService } from "@/services/music.service";
import type { Track } from "@/types";

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [playlist, setPlaylist] = useState<{
    name: string;
    tracks: Track[];
  } | null>(null);

  useEffect(() => {
    if (id) {
      playlistService.getPlaylist(id).then(setPlaylist);
    }
  }, [id]);

  if (!playlist) {
    return (
      <p className="py-20 text-center text-muted-foreground">
        {t("common.loading")}
      </p>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        title={playlist.name}
        subtitle={t("playlists.trackCount", { count: playlist.tracks.length })}
      />
      <div className="space-y-1">
        {playlist.tracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            queue={playlist.tracks}
          />
        ))}
      </div>
    </div>
  );
}
