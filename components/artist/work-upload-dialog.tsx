"use client";

import { useEffect, useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import { useTranslation } from "@/hooks/use-translation";
import type { ArtistWork, ArtistWorkInput, ReleaseType } from "@/types";

interface WorkUploadDialogProps {
  open: boolean;
  initialWork?: ArtistWork | null;
  onClose: () => void;
  onSubmit: (input: ArtistWorkInput) => Promise<void>;
}

const CURRENT_YEAR = new Date().getFullYear();

export function WorkUploadDialog({
  open,
  initialWork,
  onClose,
  onSubmit,
}: WorkUploadDialogProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [title, setTitle] = useState("");
  const [releaseType, setReleaseType] = useState<ReleaseType>("single");
  const [genre, setGenre] = useState("");
  const [releaseYear, setReleaseYear] = useState(String(CURRENT_YEAR));
  const [collaborators, setCollaborators] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [audioName, setAudioName] = useState("");
  const [coverName, setCoverName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setTitle(initialWork?.title ?? "");
      setReleaseType(initialWork?.releaseType ?? "single");
      setGenre(initialWork?.genre ?? "");
      setReleaseYear(String(initialWork?.releaseYear ?? CURRENT_YEAR));
      setCollaborators(initialWork?.collaborators.join("، ") ?? "");
      setLyrics(initialWork?.lyrics ?? "");
      setAudioName("");
      setCoverName("");
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, initialWork]);

  const isEditing = Boolean(initialWork);
  const canSubmit = title.trim() && genre.trim() && (isEditing || audioName);

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    await onSubmit({
      title: title.trim(),
      releaseType,
      genre: genre.trim(),
      releaseYear: Number(releaseYear) || CURRENT_YEAR,
      collaborators: collaborators
        .split(/[,،]/)
        .map((name) => name.trim())
        .filter(Boolean),
      lyrics,
      coverUrl: "",
      audioUrl: "",
    });
    setSubmitting(false);
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
            selectedName={audioName}
            selectedLabel={t("artist.audioSelected")}
            onSelect={setAudioName}
          />
          <FileField
            label={t("artist.coverImage")}
            accept="image/*"
            selectedName={coverName}
            selectedLabel={t("artist.coverSelected")}
            onSelect={setCoverName}
          />
        </div>
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
  selectedName,
  selectedLabel,
  onSelect,
}: {
  label: string;
  accept: string;
  selectedName: string;
  selectedLabel: string;
  onSelect: (name: string) => void;
}) {
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
          onChange={(e) => onSelect(e.target.files?.[0]?.name ?? "")}
        />
      </label>
    </div>
  );
}
