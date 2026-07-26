"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { PlaylistCard } from "@/components/cards/playlist-card";
import { EmptyState } from "@/components/shared/empty-state";
import { FadeIn, Stagger, StaggerItem } from "@/components/shared/motion";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { canCreatePlaylist } from "@/config/subscription";
import { useTranslation } from "@/hooks/use-translation";
import { parseApiError } from "@/lib/parse-api-error";
import { usePlan } from "@/providers/plans-provider";
import { playlistService } from "@/services/music.service";
import type { Playlist } from "@/types";

export default function PlaylistsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id;
  // The quota comes from the plan the API serves, so an admin re-scoping a
  // tier changes this hint with no frontend release (spec 2.11.3).
  const plan = usePlan(user?.subscription);
  const limit = plan?.maxPlaylists ?? null;
  const canCreate = canCreatePlaylist(plan, playlists.length);

  useEffect(() => {
    if (!userId) return;
    playlistService
      .getPlaylists()
      .then(setPlaylists)
      .finally(() => setLoading(false));
  }, [userId]);

  const handleCreate = async () => {
    if (!newName.trim() || !userId) return;
    setError(null);
    try {
      const created = await playlistService.createPlaylist(newName.trim());
      setPlaylists((prev) => [...prev, created]);
      setNewName("");
      setShowCreate(false);
    } catch (err) {
      // The server is the real gate; it answers PLAYLIST_LIMIT_REACHED or a
      // field error (e.g. a duplicate name), and both are worth showing.
      setError(parseApiError(err, t("playlists.limitReached")));
    }
  };

  return (
    <FadeIn className="space-y-6 py-4">
      <SectionHeader
        title={t("playlists.title")}
        subtitle={
          limit !== null
            ? t("playlists.count", { current: playlists.length, max: limit })
            : t("common.unlimited")
        }
        action={
          canCreate && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="size-4" />
              {t("playlists.new")}
            </Button>
          )
        }
      />

      {/* Tier limit reached (spec 2.7 — 6/100/unlimited) */}
      {!canCreate && !loading && (
        <p className="rounded-lg bg-muted/60 p-3 text-sm leading-6 text-muted-foreground">
          {t("playlists.limitReached")}
        </p>
      )}

      {showCreate && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder={t("playlists.namePlaceholder")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <Button onClick={handleCreate}>{t("common.create")}</Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>
              {t("common.cancel")}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : playlists.length === 0 ? (
        <EmptyState
          title={t("playlists.emptyTitle")}
          description={t("playlists.emptyDescription")}
          action={
            canCreate && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="size-4" />
                {t("playlists.createFirst")}
              </Button>
            )
          }
        />
      ) : (
        <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {playlists.map((playlist) => (
            <StaggerItem key={playlist.id}>
              <PlaylistCard playlist={playlist} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </FadeIn>
  );
}
