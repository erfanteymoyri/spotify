"use client";

import { useEffect, useState } from "react";
import { PlaylistCard } from "@/components/cards/playlist-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { canCreatePlaylist, subscriptionLimits } from "@/config/subscription";
import { useTranslation } from "@/hooks/use-translation";
import { playlistService } from "@/services/music.service";
import type { Playlist } from "@/types";
import { Plus } from "lucide-react";

export default function PlaylistsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  const tier = user?.subscription ?? "free";
  const limit = subscriptionLimits[tier].maxPlaylists;
  const canCreate = canCreatePlaylist(tier, playlists.length);

  useEffect(() => {
    playlistService
      .getPlaylists()
      .then(setPlaylists)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !canCreate) return;
    const created = await playlistService.createPlaylist(newName.trim());
    setPlaylists((prev) => [...prev, created]);
    setNewName("");
    setShowCreate(false);
  };

  return (
    <div className="space-y-6 py-4">
      <SectionHeader
        title={t("playlists.title")}
        subtitle={
          limit !== null
            ? t("playlists.count", {
                current: playlists.length,
                max: limit,
              })
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

      {showCreate && (
        <div className="flex gap-2">
          <Input
            placeholder={t("playlists.namePlaceholder")}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Button onClick={handleCreate}>{t("common.create")}</Button>
          <Button variant="ghost" onClick={() => setShowCreate(false)}>
            {t("common.cancel")}
          </Button>
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      )}
    </div>
  );
}
