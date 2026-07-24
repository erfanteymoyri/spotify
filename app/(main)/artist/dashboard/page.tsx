"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Music2, Radio, Coins } from "lucide-react";
import { AlbumManager } from "@/components/artist/album-manager";
import { WorkUploadDialog } from "@/components/artist/work-upload-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { formatCompactNumber } from "@/lib/format";
import { confirmToast, toast } from "@/lib/toast";
import {
  artistService,
  type ArtistWorkFiles,
} from "@/services/artist.service";
import type { ArtistAlbum, ArtistWork, ArtistWorkInput } from "@/types";
import { cn } from "@/lib/utils";

/** Shown when a work has no artwork of its own and no album to inherit from. */
const FALLBACK_COVER = "/cover/cover5.jpg";

type StudioTab = "tracks" | "albums";

/** The studio's two lists, always fetched as a pair — see `refresh` below. */
const loadStudio = () =>
  Promise.all([artistService.getWorks(), artistService.getAlbums()]);

export default function ArtistDashboardPage() {
  const { t } = useTranslation();
  const [works, setWorks] = useState<ArtistWork[]>([]);
  const [albums, setAlbums] = useState<ArtistAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StudioTab>("tracks");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ArtistWork | null>(null);

  /**
   * Both lists are refetched together, never one alone: moving a track in or
   * out of an album changes that track's `albumId` *and* the tracklists and
   * numbering of the albums involved. Refreshing only the album would leave the
   * "add a track" picker offering a track that is no longer a single.
   */
  const refresh = useCallback(
    () =>
      loadStudio().then(([nextWorks, nextAlbums]) => {
        setWorks(nextWorks);
        setAlbums(nextAlbums);
      }),
    [],
  );

  useEffect(() => {
    // `active` guards against a language switch re-running this while the
    // first request is still in flight, which would otherwise let the older
    // response land last and overwrite the newer one.
    let active = true;

    loadStudio()
      .then(([nextWorks, nextAlbums]) => {
        if (!active) return;
        setWorks(nextWorks);
        setAlbums(nextAlbums);
      })
      .catch(() => toast.error(t("common.error")))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [t]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (work: ArtistWork) => {
    setEditing(work);
    setDialogOpen(true);
  };

  const submit = async (input: ArtistWorkInput, files: ArtistWorkFiles) => {
    if (editing) {
      // Metadata only — the audio file of a published work is immutable.
      await artistService.updateWork(editing.id, input);
    } else {
      await artistService.uploadWork(input, files);
    }
    // Publishing into an album changes that album's tracklist too, so take the
    // server's view of both rather than splicing the response in locally.
    await refresh();
    setDialogOpen(false);
  };

  const remove = (id: string) => {
    confirmToast({
      title: t("artist.deleteConfirm"),
      confirmLabel: t("common.delete"),
      cancelLabel: t("common.cancel"),
      destructive: true,
      onConfirm: async () => {
        await artistService.deleteWork(id);
        toast.success(t("artist.workDeleted"));
        await refresh();
      },
    });
  };

  const tabs: { key: StudioTab; label: string }[] = [
    { key: "tracks", label: t("artist.tabTracks") },
    { key: "albums", label: t("artist.tabAlbums") },
  ];

  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        title={t("artist.manageWorks")}
        subtitle={t("artist.manageWorksSubtitle")}
        action={
          tab === "tracks" ? (
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              {t("artist.uploadWork")}
            </Button>
          ) : undefined
        }
      />

      <div
        role="tablist"
        className="flex gap-1 rounded-lg border border-border bg-card/40 p-1"
      >
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              tab === key
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : tab === "albums" ? (
        <AlbumManager albums={albums} works={works} onChanged={refresh} />
      ) : works.length === 0 ? (
        <EmptyState
          title={t("artist.worksEmptyTitle")}
          description={t("artist.worksEmptyDescription")}
          action={
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              {t("artist.uploadWork")}
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {works.map((work) => (
            <WorkRow
              key={work.id}
              work={work}
              onEdit={() => openEdit(work)}
              onDelete={() => remove(work.id)}
            />
          ))}
        </div>
      )}

      <WorkUploadDialog
        open={dialogOpen}
        initialWork={editing}
        albums={albums}
        onClose={() => setDialogOpen(false)}
        onSubmit={submit}
      />
    </div>
  );
}

function WorkRow({
  work,
  onEdit,
  onDelete,
}: {
  work: ArtistWork;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card/40 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-md">
          <Image
            src={work.coverUrl ?? FALLBACK_COVER}
            alt={work.title}
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold">{work.title}</h3>
            <Badge variant="muted">{t(`artist.${work.releaseType}`)}</Badge>
            {work.isEarlyAccess && (
              <Badge variant="warning" title={t("artist.earlyAccessHint")}>
                {t("artist.earlyAccess")}
              </Badge>
            )}
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {work.albumName ? `${work.albumName} · ` : ""}
            {work.genre} · {work.releaseYear}
          </p>
        </div>
      </div>

      {/* Compact notation keeps large revenue numbers inside their column */}
      <div className="grid shrink-0 grid-cols-3 gap-5 sm:w-80">
        <Metric
          icon={<Music2 className="size-4" />}
          label={t("artist.listeners")}
          value={formatCompactNumber(work.listenersCount ?? 0)}
        />
        <Metric
          icon={<Radio className="size-4" />}
          label={t("artist.streams")}
          value={formatCompactNumber(work.streamsCount ?? 0)}
        />
        <Metric
          icon={<Coins className="size-4" />}
          label={t("artist.revenue")}
          value={formatCompactNumber(work.revenue)}
        />
      </div>

      <div className="flex shrink-0 gap-2 sm:flex-col lg:flex-row">
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
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 text-center">
      <span className="flex items-center justify-center gap-1 text-muted-foreground">
        {icon}
      </span>
      <p className="mt-1 truncate text-sm font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[0.7rem] leading-4 text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
