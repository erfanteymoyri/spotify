"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { AlbumEditorDialog } from "@/components/artist/album-editor-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Select } from "@/ui/select";
import { useTranslation } from "@/hooks/use-translation";
import { formatDate } from "@/lib/format";
import { parseApiError } from "@/lib/parse-api-error";
import { confirmToast, toast } from "@/lib/toast";
import { artistService } from "@/services/artist.service";
import type { ArtistAlbum, ArtistWork } from "@/types";

const FALLBACK_COVER = "/cover/cover5.jpg";

interface AlbumManagerProps {
  albums: ArtistAlbum[];
  /** Every work the artist owns — the source of the "add a track" picker. */
  works: ArtistWork[];
  /** Membership changes renumber tracks, so the parent refetches both lists. */
  onChanged: () => void;
}

/**
 * Curating albums after they exist (spec 2.10).
 *
 * Every mutation replaces the album with the server's copy rather than editing
 * the local one: adding or removing a track resequences the whole tracklist
 * server-side, and a locally patched order would be wrong the moment it
 * differed from that.
 */
export function AlbumManager({ albums, works, onChanged }: AlbumManagerProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<ArtistAlbum | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (album: ArtistAlbum) => {
    setEditing(album);
    setDialogOpen(true);
  };

  const handleSaved = () => {
    setDialogOpen(false);
    onChanged();
  };

  const remove = (album: ArtistAlbum) => {
    confirmToast({
      title: t("artist.albumDeleteConfirm"),
      confirmLabel: t("common.delete"),
      cancelLabel: t("common.cancel"),
      destructive: true,
      onConfirm: async () => {
        await artistService.deleteAlbum(album.id);
        toast.success(t("artist.albumDeleted"));
        onChanged();
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          {t("artist.newAlbum")}
        </Button>
      </div>

      {albums.length === 0 ? (
        <EmptyState
          title={t("artist.albumsEmptyTitle")}
          description={t("artist.albumsEmptyDescription")}
          action={
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              {t("artist.newAlbum")}
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {albums.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              // Only singles can be pulled in; a track already in another album
              // would silently be moved out of it, which is a different action.
              available={works.filter((work) => work.albumId === null)}
              onEdit={() => openEdit(album)}
              onDelete={() => remove(album)}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}

      {/* Mounted only while open, so each visit starts from the album's
          current values rather than whatever the last visit left behind. */}
      {dialogOpen && (
        <AlbumEditorDialog
          album={editing}
          onClose={() => setDialogOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function AlbumCard({
  album,
  available,
  onEdit,
  onDelete,
  onChanged,
}: {
  album: ArtistAlbum;
  available: ArtistWork[];
  onEdit: () => void;
  onDelete: () => void;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState(false);

  /** One guard for every mutation, so a double click cannot race the server. */
  const run = async (action: () => Promise<unknown>) => {
    if (pending) return;
    setPending(true);
    try {
      await action();
      onChanged();
    } catch (err) {
      toast.error(parseApiError(err, t("common.error")));
    } finally {
      setPending(false);
    }
  };

  const move = (index: number, delta: number) => {
    const order = album.tracks.map((track) => track.id);
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    void run(() => artistService.reorderAlbum(album.id, order));
  };

  return (
    <div className="rounded-xl border border-border bg-card/40">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-md">
            <Image
              src={album.coverUrl ?? FALLBACK_COVER}
              alt={album.title}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold">{album.title}</h3>
              {album.isEarlyAccess && (
                <Badge variant="warning" title={t("artist.earlyAccessHint")}>
                  {t("artist.earlyAccess")}
                </Badge>
              )}
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {t("artist.albumTrackCount", { count: album.trackCount })}
              {album.genre ? ` · ${album.genre}` : ""}
              {` · ${formatDate(album.releaseDate)}`}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
          >
            {t("artist.manageTracks")}
            {expanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label={t("common.edit")}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label={t("common.delete")}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-border p-4">
          {album.tracks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("artist.albumEmptyTracks")}
            </p>
          ) : (
            <ol className="space-y-2">
              {album.tracks.map((track, index) => (
                <li
                  key={track.id}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2"
                >
                  <span className="w-6 shrink-0 text-center text-sm tabular-nums text-muted-foreground">
                    {track.trackNumber}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {track.title}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={pending || index === 0}
                      onClick={() => move(index, -1)}
                      aria-label={t("artist.moveUp")}
                    >
                      <ChevronUp className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={pending || index === album.tracks.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label={t("artist.moveDown")}
                    >
                      <ChevronDown className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={pending}
                      onClick={() =>
                        run(() =>
                          artistService.removeTrackFromAlbum(album.id, track.id),
                        )
                      }
                      aria-label={t("artist.removeFromAlbum")}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div className="space-y-1.5 border-t border-border/60 pt-3">
            <label className="text-sm font-medium" htmlFor={`add-${album.id}`}>
              {t("artist.addTrack")}
            </label>
            {available.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("artist.noSinglesToAdd")}
              </p>
            ) : (
              <>
                <Select
                  id={`add-${album.id}`}
                  value=""
                  disabled={pending}
                  onChange={(e) => {
                    const trackId = e.target.value;
                    if (!trackId) return;
                    void run(() =>
                      artistService.addTrackToAlbum(album.id, trackId),
                    );
                  }}
                >
                  <option value="">{t("artist.addTrackHint")}</option>
                  {available.map((work) => (
                    <option key={work.id} value={work.id}>
                      {work.title}
                    </option>
                  ))}
                </Select>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
