"use client";

import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { routes } from "@/config/site";
import { getAlbumTracks } from "@/lib/mock-data";
import { usePlayerStore } from "@/stores/player-store";
import type { Album } from "@/types";
import { cn } from "@/lib/utils";

interface AlbumCardProps {
  album: Album;
  className?: string;
}

export function AlbumCard({ album, className }: AlbumCardProps) {
  const { t } = useTranslation();
  const playTrack = usePlayerStore((s) => s.playTrack);

  return (
    <div
      className={cn(
        "group relative rounded-lg bg-card/40 p-4 transition-colors hover:bg-card/80",
        className,
      )}
    >
      <Link href={routes.album(album.id)} className="block">
        <div className="relative mb-4 aspect-square overflow-hidden rounded-md shadow-lg">
          <Image
            src={album.coverUrl}
            alt={album.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 200px"
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              const tracks = getAlbumTracks(album.id);
              if (tracks.length > 0) {
                playTrack(tracks[0], tracks);
              }
            }}
            className="absolute bottom-2 left-2 flex size-12 translate-y-2 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-xl transition-all group-hover:translate-y-0 group-hover:opacity-100"
            aria-label={t("player.playAlbum")}
          >
            <Play className="size-5 fill-current" />
          </button>
        </div>
        <h3 className="truncate font-semibold">{album.title}</h3>
        <Link
          href={routes.artist(album.artistId)}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 block truncate text-sm text-muted-foreground hover:underline"
        >
          {album.artistName}
        </Link>
      </Link>
    </div>
  );
}
