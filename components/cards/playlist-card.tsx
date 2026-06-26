"use client";

import Link from "next/link";
import Image from "next/image";
import { ListMusic } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { routes } from "@/config/site";
import type { Playlist } from "@/types";
import { cn } from "@/lib/utils";

interface PlaylistCardProps {
  playlist: Playlist;
  className?: string;
}

export function PlaylistCard({ playlist, className }: PlaylistCardProps) {
  const { t } = useTranslation();

  return (
    <Link
      href={routes.playlist(playlist.id)}
      className={cn(
        "group block rounded-lg bg-card/40 p-4 transition-colors hover:bg-card/80",
        className,
      )}
    >
      <div className="relative mb-4 aspect-square overflow-hidden rounded-md bg-muted shadow-lg">
        {playlist.coverUrl ? (
          <Image
            src={playlist.coverUrl}
            alt={playlist.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 200px"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ListMusic className="size-12 text-muted-foreground" />
          </div>
        )}
      </div>
      <h3 className="truncate font-semibold">{playlist.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("playlists.trackCount", { count: playlist.trackIds.length })}
      </p>
    </Link>
  );
}
