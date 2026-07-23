"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ListPlus, Pencil, Trash2 } from "lucide-react";
import { TrackCard } from "@/components/cards/track-card";
import { EmptyState } from "@/components/shared/empty-state";
import { FadeIn } from "@/components/shared/motion";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/ui/button";
import { Dialog } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { routes } from "@/config/site";
import { useTranslation } from "@/hooks/use-translation";
import { playlistService } from "@/services/music.service";
import { useAuthStore } from "@/stores/auth-store";
import type { Track } from "@/types";

interface PlaylistView {
  id: string;
  name: string;
  tracks: Track[];
}

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.user?.id);
  const [playlist, setPlaylist] = useState<PlaylistView | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id || !userId) return;
    playlistService
      .getPlaylist(userId, id)
      .then(setPlaylist)
      .catch(() => setNotFound(true));
  }, [id, userId]);

  const handleRename = async () => {
    if (!userId || !playlist || !renameValue.trim() || saving) return;
    setSaving(true);
    try {
      const updated = await playlistService.renamePlaylist(
        userId,
        playlist.id,
        renameValue.trim(),
      );
      setPlaylist((prev) => (prev ? { ...prev, name: updated.name } : prev));
      setRenameOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!userId || !playlist) return;
    if (!window.confirm(t("playlists.deleteConfirm"))) return;
    await playlistService.deletePlaylist(userId, playlist.id);
    router.replace(routes.playlists);
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (!userId || !playlist) return;
    const updated = await playlistService.removeTrackFromPlaylist(
      userId,
      playlist.id,
      trackId,
    );
    setPlaylist((prev) =>
      prev
        ? {
            ...prev,
            tracks: prev.tracks.filter((t) => updated.trackIds.includes(t.id)),
          }
        : prev,
    );
  };

  if (notFound) {
    return (
      <div className="py-10">
        <EmptyState title={t("errors.playlistNotFound")} />
      </div>
    );
  }

  if (!playlist) {
    return (
      <p className="py-20 text-center text-muted-foreground">
        {t("common.loading")}
      </p>
    );
  }

  return (
    <FadeIn className="space-y-6 py-4">
      <SectionHeader
        title={playlist.name}
        subtitle={t("playlists.trackCount", { count: playlist.tracks.length })}
        action={
          <div className="flex gap-2">
            {/* Adding songs happens from the albums & singles page (spec 2.7) */}
            <Button asChild size="sm">
              <Link href={routes.library}>
                <ListPlus className="size-4" />
                {t("playlists.addTracks")}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRenameValue(playlist.name);
                setRenameOpen(true);
              }}
            >
              <Pencil className="size-4" />
              {t("playlists.rename")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="size-4" />
              {t("common.delete")}
            </Button>
          </div>
        }
      />

      {playlist.tracks.length === 0 ? (
        <EmptyState
          title={t("playlists.emptyTracksTitle")}
          description={t("playlists.emptyTracksDescription")}
          action={
            <Button asChild>
              <Link href={routes.library}>
                <ListPlus className="size-4" />
                {t("playlists.addTracks")}
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-1">
          {playlist.tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              queue={playlist.tracks}
              actions={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={t("playlists.removeTrack")}
                  onClick={() => handleRemoveTrack(track.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              }
            />
          ))}
        </div>
      )}

      <Dialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title={t("playlists.renameTitle")}
        closeLabel={t("common.close")}
        footer={
          <div className="flex gap-3">
            <Button className="flex-1" disabled={saving} onClick={handleRename}>
              {saving ? t("common.saving") : t("common.save")}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setRenameOpen(false)}
            >
              {t("common.cancel")}
            </Button>
          </div>
        }
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRename()}
          placeholder={t("playlists.namePlaceholder")}
          autoFocus
        />
      </Dialog>
    </FadeIn>
  );
}
