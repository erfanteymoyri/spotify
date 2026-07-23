"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { formatDuration } from "@/lib/format";
import { usePlayerStore } from "@/stores/player-store";
import { Button } from "@/ui/button";
import { cn } from "@/lib/utils";

interface QueuePanelProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Upcoming-tracks panel anchored above the player bar (spec 2.9).
 * Click a row to jump to it; hover reveals a remove-from-queue action.
 */
export function QueuePanel({ open, onClose }: QueuePanelProps) {
  const { t } = useTranslation();
  const { queue, currentTrack, isPlaying, playTrack, removeFromQueue } =
    usePlayerStore();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
          className="absolute bottom-[calc(100%+0.75rem)] left-3 z-40 flex max-h-[55dvh] w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-border/60 bg-popover/95 shadow-2xl shadow-black/30 backdrop-blur-xl sm:left-4 sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
            <h3 className="text-sm font-semibold">{t("player.queue")}</h3>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label={t("common.close")}
            >
              <X className="size-4" />
            </Button>
          </div>

          {queue.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm leading-6 text-muted-foreground">
              {t("player.queueEmpty")}
            </p>
          ) : (
            <ul className="flex-1 overflow-y-auto p-2">
              {queue.map((track) => {
                const isCurrent = track.id === currentTrack?.id;
                return (
                  <li
                    key={track.id}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl p-2 transition-colors",
                      isCurrent ? "bg-primary/10" : "hover:bg-muted/60",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => playTrack(track, queue)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-start"
                    >
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={track.coverUrl}
                          alt={track.title}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-sm font-medium",
                            isCurrent && "text-primary",
                          )}
                        >
                          {track.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs leading-5 text-muted-foreground">
                          {isCurrent && isPlaying
                            ? t("player.nowPlaying")
                            : track.artistName}
                        </p>
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatDuration(track.duration)}
                      </span>
                    </button>
                    {!isCurrent && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeFromQueue(track.id)}
                        aria-label={t("player.removeFromQueue")}
                        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-destructive"
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
