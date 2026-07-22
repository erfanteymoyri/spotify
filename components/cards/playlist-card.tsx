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
        "group block rounded-xl bg-card/40 p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-card hover:shadow-xl hover:shadow-black/10",
        className,
      )}
    >
      <div className="relative mb-4 aspect-square overflow-hidden rounded-lg bg-muted shadow-lg">
        {playlist.coverUrl ? (
          <Image
            src={playlist.coverUrl}
            alt={playlist.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 200px"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 to-muted">
            <ListMusic className="size-12 text-muted-foreground transition-transform duration-300 group-hover:scale-110" />
          </div>
        )}
      </div>
      <h3 className="truncate font-semibold">{playlist.name}</h3>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
        {t("playlists.trackCount", { count: playlist.trackIds.length })}
      </p>
    </Link>
  );
}
