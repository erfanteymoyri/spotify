"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Music2, Radio, Coins } from "lucide-react";
import { WorkUploadDialog } from "@/components/artist/work-upload-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { formatCompactNumber } from "@/lib/format";
import { confirmToast, toast } from "@/lib/toast";
import { artistService } from "@/services/artist.service";
import type { ArtistWork, ArtistWorkInput } from "@/types";

export default function ArtistDashboardPage() {
  const { t } = useTranslation();
  const [works, setWorks] = useState<ArtistWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ArtistWork | null>(null);

  useEffect(() => {
    artistService
      .getWorks()
      .then(setWorks)
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (work: ArtistWork) => {
    setEditing(work);
    setDialogOpen(true);
  };

  const submit = async (input: ArtistWorkInput) => {
    if (editing) {
      const updated = await artistService.updateWork(editing.id, input);
      if (updated) {
        setWorks((prev) =>
          prev.map((work) => (work.id === updated.id ? updated : work)),
        );
      }
    } else {
      const created = await artistService.uploadWork(input);
      setWorks((prev) => [created, ...prev]);
    }
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
        setWorks((prev) => prev.filter((work) => work.id !== id));
        toast.success(t("artist.workDeleted"));
      },
    });
  };

  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        title={t("artist.manageWorks")}
        subtitle={t("artist.manageWorksSubtitle")}
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            {t("artist.uploadWork")}
          </Button>
        }
      />

      {loading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
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
            src={work.coverUrl}
            alt={work.title}
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{work.title}</h3>
            <Badge variant="muted">{t(`artist.${work.releaseType}`)}</Badge>
          </div>
          <p className="truncate text-sm text-muted-foreground">
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
