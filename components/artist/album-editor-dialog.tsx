"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/ui/button";
import { Dialog } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { useTranslation } from "@/hooks/use-translation";
import { parseApiError } from "@/lib/parse-api-error";
import { artistService } from "@/services/artist.service";
import type { ArtistAlbum } from "@/types";

interface AlbumEditorDialogProps {
  /** Null creates a new album; an album edits it in place. */
  album: ArtistAlbum | null;
  onClose: () => void;
  onSaved: (album: ArtistAlbum) => void;
}

/** `<input type="date">` wants `YYYY-MM-DD`; the API sends exactly that. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The album form.
 *
 * Mounted only while open (see `AlbumManager`), so the draft is seeded from
 * `album` by the `useState` initialisers and thrown away on close. That is what
 * keeps switching between "edit this album" and "new album" from carrying the
 * previous values across, without an effect that re-seeds the fields — and
 * therefore without a render pass where the form shows the wrong album.
 */
export function AlbumEditorDialog({
  album,
  onClose,
  onSaved,
}: AlbumEditorDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(album?.title ?? "");
  const [genre, setGenre] = useState(album?.genre ?? "");
  const [releaseDate, setReleaseDate] = useState(
    album?.releaseDate ?? todayIso(),
  );
  const [cover, setCover] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = title.trim() && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const input = { title: title.trim(), genre: genre.trim(), releaseDate };
      onSaved(
        album
          ? await artistService.updateAlbum(album.id, input, cover)
          : await artistService.createAlbum(input, cover),
      );
    } catch (err) {
      setError(parseApiError(err, t("artist.albumSaveFailed")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={album ? t("artist.editAlbum") : t("artist.newAlbum")}
      closeLabel={t("common.close")}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} disabled={!canSave}>
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      }
    >
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="album-title">
          {t("artist.albumTitle")}
        </label>
        <Input
          id="album-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="album-genre">
            {t("artist.genre")}
          </label>
          <Input
            id="album-genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="album-date">
            {t("artist.releaseDate")}
          </label>
          <Input
            id="album-date"
            type="date"
            dir="ltr"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t("artist.coverImage")}</label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input bg-background/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50">
          <UploadCloud className="size-4 shrink-0" />
          <span className="truncate">
            {cover ? `${t("artist.coverSelected")}: ${cover.name}` : t("artist.coverImage")}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setCover(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </Dialog>
  );
}
