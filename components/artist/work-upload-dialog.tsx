"use client";

import { useEffect, useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Select } from "@/ui/select";
import { Textarea } from "@/ui/textarea";
import { useTranslation } from "@/hooks/use-translation";
import { parseApiError } from "@/lib/parse-api-error";
import type {
  ArtistAlbum,
  ArtistWork,
  ArtistWorkInput,
  ReleaseType,
} from "@/types";
import type { ArtistWorkFiles } from "@/services/artist.service";

interface WorkUploadDialogProps {
  open: boolean;
  initialWork?: ArtistWork | null;
  /** The artist's existing albums, so a track can be published straight into one. */
  albums?: ArtistAlbum[];
  onClose: () => void;
  onSubmit: (input: ArtistWorkInput, files: ArtistWorkFiles) => Promise<void>;
}

/** Sentinel for "make a new album named after this track" in the album picker. */
const NEW_ALBUM = "";

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Reads a track's length from the file itself, so the artist does not have to
 * type it and the stored duration always matches the audio.
 */
function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    const done = (seconds: number) => {
      URL.revokeObjectURL(url);
      resolve(Math.round(seconds) || 0);
    };
    audio.addEventListener("loadedmetadata", () => done(audio.duration));
    audio.addEventListener("error", () => done(0));
  });
}

export function WorkUploadDialog({
  open,
  initialWork,
  albums = [],
  onClose,
  onSubmit,
}: WorkUploadDialogProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [title, setTitle] = useState("");
  const [releaseType, setReleaseType] = useState<ReleaseType>("single");
  const [albumId, setAlbumId] = useState<string>(NEW_ALBUM);
  const [genre, setGenre] = useState("");
  const [releaseYear, setReleaseYear] = useState(String(CURRENT_YEAR));
  const [collaborators, setCollaborators] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setTitle(initialWork?.title ?? "");
      setReleaseType(initialWork?.releaseType ?? "single");
      setAlbumId(initialWork?.albumId ?? NEW_ALBUM);
      setGenre(initialWork?.genre ?? "");
      setReleaseYear(String(initialWork?.releaseYear ?? CURRENT_YEAR));
      setCollaborators(initialWork?.collaborators.join("، ") ?? "");
      setLyrics(initialWork?.lyrics ?? "");
      setAudioFile(null);
      setCoverFile(null);
      setError(null);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, initialWork]);

  const isEditing = Boolean(initialWork);
  const canSubmit = title.trim() && genre.trim() && (isEditing || audioFile);

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(
        {
          title: title.trim(),
          releaseType,
          // Only meaningful for an album release; sending it for a single
          // would file a track under an album the artist did not ask for.
          albumId:
            releaseType === "album" && albumId !== NEW_ALBUM ? albumId : null,
          genre: genre.trim(),
          releaseYear: Number(releaseYear) || CURRENT_YEAR,
          collaborators: collaborators
            .split(/[,،]/)
            .map((name) => name.trim())
            .filter(Boolean),
          lyrics,
          duration: audioFile ? await readAudioDuration(audioFile) : undefined,
        },
        { audio: audioFile, cover: coverFile },
      );
    } catch (err) {
      setError(parseApiError(err, t("artist.uploadFailed")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-50 m-auto w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-border bg-background p-0 shadow-xl backdrop:bg-black/60 open:flex open:flex-col"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="text-lg font-semibold">
          {isEditing ? t("artist.editWork") : t("artist.uploadTitle")}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={t("common.close")}
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Two-column compact layout keeps the whole form in view (no scrolling) */}
      <div className="max-h-[calc(100dvh-11rem)] space-y-3 overflow-y-auto px-5 py-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("artist.trackTitle")}>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label={t("artist.releaseType")}>
            <div className="flex gap-2">
              {(["single", "album"] as ReleaseType[]).map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={releaseType === type ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setReleaseType(type)}
                >
                  {t(`artist.${type}`)}
                </Button>
              ))}
            </div>
          </Field>
        </div>

        {/* Only when releasing as part of an album, and only when publishing:
            moving an existing track between albums is the album editor's job,
            where the tracklist and its numbering are visible. */}
        {releaseType === "album" && !isEditing && albums.length > 0 && (
          <Field label={t("artist.uploadIntoAlbum")}>
            <Select
              value={albumId}
              onChange={(e) => setAlbumId(e.target.value)}
            >
              <option value={NEW_ALBUM}>{t("artist.newAlbumFromTrack")}</option>
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.title}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("artist.genre")}>
            <Input value={genre} onChange={(e) => setGenre(e.target.value)} />
          </Field>
          <Field label={t("artist.releaseYear")}>
            <Input
              type="number"
              inputMode="numeric"
              dir="ltr"
              value={releaseYear}
              onChange={(e) => setReleaseYear(e.target.value)}
            />
          </Field>
        </div>

        <Field label={t("artist.collaborators")}>
          <Input
            value={collaborators}
            onChange={(e) => setCollaborators(e.target.value)}
            placeholder={t("artist.collaboratorsPlaceholder")}
          />
        </Field>

        <Field label={`${t("artist.lyrics")} (${t("common.optional")})`}>
          <Textarea
            rows={2}
            className="min-h-0"
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <FileField
            label={t("artist.audioFile")}
            accept="audio/mpeg,audio/wav,audio/flac,.mp3,.wav,.flac"
            file={audioFile}
            selectedLabel={t("artist.audioSelected")}
            onSelect={setAudioFile}
          />
          <FileField
            label={t("artist.coverImage")}
            accept="image/*"
            file={coverFile}
            selectedLabel={t("artist.coverSelected")}
            onSelect={setCoverFile}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
        <Button variant="ghost" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button onClick={submit} disabled={!canSubmit || submitting}>
          {submitting
            ? t("artist.publishing")
            : isEditing
              ? t("common.save")
              : t("artist.publish")}
        </Button>
      </div>
    </dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function FileField({
  label,
  accept,
  file,
  selectedLabel,
  onSelect,
}: {
  label: string;
  accept: string;
  file: File | null;
  selectedLabel: string;
  onSelect: (file: File | null) => void;
}) {
  const selectedName = file?.name ?? "";
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input bg-background/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50">
        <UploadCloud className="size-4 shrink-0" />
        <span className="truncate">
          {selectedName ? `${selectedLabel}: ${selectedName}` : label}
        </span>
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );
}
