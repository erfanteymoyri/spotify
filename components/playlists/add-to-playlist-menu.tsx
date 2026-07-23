"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ListPlus, Plus } from "lucide-react";
import { canCreatePlaylist } from "@/config/subscription";
import { useTranslation } from "@/hooks/use-translation";
import { playlistService } from "@/services/music.service";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import type { Playlist } from "@/types";
import { cn } from "@/lib/utils";

interface AddToPlaylistMenuProps {
  trackId: string;
}

/**
 * Per-card playlist menu (spec 2.8): toggle the track in any of the user's
 * playlists, with a quick-create shortcut gated by the subscription limit.
 */
export function AddToPlaylistMenu({ trackId }: AddToPlaylistMenuProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[] | null>(null);
  const [newName, setNewName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const userId = user?.id;
  const tier = user?.subscription ?? "free";
  const canCreate =
    playlists !== null && canCreatePlaylist(tier, playlists.length);

  // Lazy-load playlists the first time the menu opens
  useEffect(() => {
    if (open && userId && playlists === null) {
      playlistService.getPlaylists(userId).then(setPlaylists);
    }
  }, [open, userId, playlists]);

  // Dismiss on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggleTrack = async (playlist: Playlist) => {
    if (!userId || busyId) return;
    setBusyId(playlist.id);
    try {
      const inPlaylist = playlist.trackIds.includes(trackId);
      const updated = inPlaylist
        ? await playlistService.removeTrackFromPlaylist(
            userId,
            playlist.id,
            trackId,
          )
        : await playlistService.addTrackToPlaylist(
            userId,
            playlist.id,
            trackId,
          );
      setPlaylists((prev) =>
        prev ? prev.map((p) => (p.id === updated.id ? updated : p)) : prev,
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleQuickCreate = async () => {
    if (!userId || !newName.trim() || busyId) return;
    setBusyId("create");
    try {
      const created = await playlistService.createPlaylist(
        userId,
        newName.trim(),
      );
      // New playlist immediately receives the track — one less click
      const updated = await playlistService.addTrackToPlaylist(
        userId,
        created.id,
        trackId,
      );
      setPlaylists((prev) => (prev ? [...prev, updated] : [updated]));
      setNewName("");
    } finally {
      setBusyId(null);
    }
  };

  if (!user) return null;

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("playlists.addToPlaylist")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(open && "bg-muted text-primary")}
      >
        <ListPlus className="size-4" />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.25, 0.4, 0.25, 1] }}
            className="absolute end-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-xl border border-border/60 bg-popover shadow-xl shadow-black/20"
          >
            <p className="border-b border-border/50 px-3 py-2.5 text-xs font-semibold text-muted-foreground">
              {t("playlists.addToPlaylist")}
            </p>

            <ul className="max-h-52 overflow-y-auto p-1.5">
              {playlists === null ? (
                <li className="px-2 py-3 text-center text-sm text-muted-foreground">
                  {t("common.loading")}
                </li>
              ) : playlists.length === 0 ? (
                <li className="px-2 py-3 text-center text-sm leading-6 text-muted-foreground">
                  {t("playlists.noPlaylistsShort")}
                </li>
              ) : (
                playlists.map((playlist) => {
                  const inPlaylist = playlist.trackIds.includes(trackId);
                  return (
                    <li key={playlist.id}>
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => toggleTrack(playlist)}
                        className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-start text-sm transition-colors hover:bg-muted/70 disabled:opacity-60"
                      >
                        <span className="truncate">{playlist.name}</span>
                        <span
                          className={cn(
                            "flex size-4.5 shrink-0 items-center justify-center rounded-full border transition-colors",
                            inPlaylist
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40",
                          )}
                        >
                          {inPlaylist && <Check className="size-3" />}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>

            {canCreate ? (
              <div className="flex items-center gap-1.5 border-t border-border/50 p-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQuickCreate()}
                  placeholder={t("playlists.namePlaceholder")}
                  className="h-8 text-sm"
                />
                <Button
                  size="icon-sm"
                  onClick={handleQuickCreate}
                  disabled={!newName.trim() || busyId !== null}
                  aria-label={t("common.create")}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            ) : (
              playlists !== null && (
                <p className="border-t border-border/50 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
                  {t("playlists.limitReached")}
                </p>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
