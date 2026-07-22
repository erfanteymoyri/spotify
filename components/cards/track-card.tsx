"use client";

import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { routes } from "@/config/site";
import { usePlayerStore } from "@/stores/player-store";
import type { Track } from "@/types";
import { cn } from "@/lib/utils";

interface TrackCardProps {
  track: Track;
  queue?: Track[];
  showAlbum?: boolean;
  className?: string;
}

export function TrackCard({
  track,
  queue,
  showAlbum = true,
  className,
}: TrackCardProps) {
  const { t } = useTranslation();
  const playTrack = usePlayerStore((s) => s.playTrack);

  return (
    <div
      className={cn(
        "group flex items-center gap-4 rounded-xl p-2.5 transition-all duration-300 hover:bg-card/70 hover:shadow-md hover:shadow-black/5",
        className,
      )}
    >
      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg shadow-sm">
        <Image
          src={track.coverUrl}
          alt={track.title}
          fill
          className="object-cover"
          sizes="48px"
        />
        <button
          type="button"
          onClick={() => playTrack(track, queue ?? [track])}
          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
          aria-label={t("player.playTrack", { title: track.title })}
        >
          <Play className="size-5 fill-white text-white" />
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => playTrack(track, queue ?? [track])}
          className="block w-full truncate text-start font-medium hover:underline"
        >
          {track.title}
        </button>
        <div className="mt-0.5 flex items-center gap-1.5 truncate text-sm leading-6 text-muted-foreground">
          <Link
            href={routes.artist(track.artistId)}
            className="transition-colors hover:text-primary hover:underline"
          >
            {track.artistName}
          </Link>
          {showAlbum && track.albumName && (
            <>
              <span>•</span>
              <Link
                href={track.albumId ? routes.album(track.albumId) : "#"}
                className="transition-colors hover:text-primary hover:underline"
              >
                {track.albumName}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
