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
        "group relative rounded-xl bg-card/40 p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-card hover:shadow-xl hover:shadow-black/10",
        className,
      )}
    >
      <div className="relative mb-4 aspect-square overflow-hidden rounded-lg shadow-lg">
        <Image
          src={album.coverUrl}
          alt={album.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 200px"
        />
        {/* Stretched link keeps the cover clickable without nesting anchors */}
        <Link
          href={routes.album(album.id)}
          className="absolute inset-0"
          aria-label={album.title}
        />
        <button
          type="button"
          onClick={() => {
            const tracks = getAlbumTracks(album.id);
            if (tracks.length > 0) {
              playTrack(tracks[0], tracks);
            }
          }}
          className="absolute bottom-2 left-2 z-10 flex size-12 translate-y-2 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-xl shadow-primary/30 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-105"
          aria-label={t("player.playAlbum")}
        >
          <Play className="size-5 fill-current" />
        </button>
      </div>
      <Link
        href={routes.album(album.id)}
        className="block truncate font-semibold hover:underline"
      >
        {album.title}
      </Link>
      <Link
        href={routes.artist(album.artistId)}
        className="mt-1.5 block truncate text-sm text-muted-foreground transition-colors hover:text-primary hover:underline"
      >
        {album.artistName}
      </Link>
    </div>
  );
}
