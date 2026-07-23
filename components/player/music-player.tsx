"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ListMusic,
  Headphones,
  Radio,
  X,
} from "lucide-react";
import { QueuePanel } from "@/components/player/queue-panel";
import { useTranslation } from "@/hooks/use-translation";
import { routes } from "@/config/site";
import { formatDuration, formatNumber } from "@/lib/format";
import { useAuthStore } from "@/stores/auth-store";
import { usePlayerStore } from "@/stores/player-store";
import { Slider } from "@/ui/slider";
import { Button } from "@/ui/button";
import { cn } from "@/lib/utils";

export function MusicPlayer() {
  const { t } = useTranslation();
  const isGold = useAuthStore((s) => s.user?.subscription === "gold");
  const [queueOpen, setQueueOpen] = useState(false);
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
    isExpanded,
    togglePlay,
    next,
    previous,
    setVolume,
    toggleMute,
    setRepeatMode,
    toggleShuffle,
    toggleExpanded,
    closePlayer,
    seekTo,
  } = usePlayerStore();

  const cycleRepeat = () => {
    const modes = ["off", "all", "one"] as const;
    const idx = modes.indexOf(repeatMode);
    setRepeatMode(modes[(idx + 1) % modes.length]);
  };

  // Wrap next so click events never leak into its fromAutoplay parameter
  const handleNext = () => next();

  const controlProps = {
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
    onTogglePlay: togglePlay,
    onPrevious: previous,
    onNext: handleNext,
    onSeek: seekTo,
    onVolumeChange: setVolume,
    onToggleMute: toggleMute,
    onCycleRepeat: cycleRepeat,
    onToggleShuffle: toggleShuffle,
  };

  return (
    <>
      {/* Full-screen view — works on every breakpoint (mobile mini-player expands into it) */}
      <AnimatePresence>
        {currentTrack && isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 48 }}
            transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
            className="scrollbar-none fixed inset-0 z-50 flex flex-col overflow-y-auto bg-gradient-to-b from-primary/15 via-card to-background p-4 sm:p-8"
          >
            <div className="flex justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={closePlayer}
                aria-label={t("player.close")}
              >
                <X className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleExpanded}
                aria-label={t("player.expand")}
              >
                <Minimize2 className="size-5" />
              </Button>
            </div>

            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-6 py-4 sm:gap-8">
              <div className="relative">
                {/* Breathing glow synced with playback */}
                {isPlaying && (
                  <motion.div
                    aria-hidden
                    className="absolute inset-0 -z-10 rounded-3xl bg-primary/35 blur-3xl"
                    animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.6, 0.35] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                  className="relative size-56 overflow-hidden rounded-2xl shadow-2xl shadow-primary/10 ring-1 ring-border/50 sm:size-72 lg:size-80"
                >
                  <Image
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </motion.div>
              </div>

              <div className="w-full max-w-xl text-center">
                <h2 className="text-2xl font-bold sm:text-3xl">
                  {currentTrack.title}
                </h2>
                {/* Artist and album as clickable links (spec 2.9) */}
                <p className="mt-3 text-base text-muted-foreground sm:text-lg">
                  <Link
                    href={routes.artist(currentTrack.artistId)}
                    className="transition-colors hover:text-primary hover:underline"
                  >
                    {currentTrack.artistName}
                  </Link>
                  {currentTrack.albumId && currentTrack.albumName && (
                    <>
                      <span className="mx-2">•</span>
                      <Link
                        href={routes.album(currentTrack.albumId)}
                        className="transition-colors hover:text-primary hover:underline"
                      >
                        {currentTrack.albumName}
                      </Link>
                    </>
                  )}
                </p>

                {/* Listener/stream stats — gold-tier perk (spec 2.9) */}
                {isGold && (
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <StatChip
                      icon={<Headphones className="size-3.5" />}
                      label={t("artist.listeners")}
                      value={currentTrack.listenersCount}
                    />
                    <StatChip
                      icon={<Radio className="size-3.5" />}
                      label={t("artist.streams")}
                      value={currentTrack.streamsCount}
                    />
                  </div>
                )}

                {currentTrack.lyrics && (
                  <p className="mt-6 max-h-32 overflow-y-auto text-sm leading-7 text-muted-foreground sm:max-h-40">
                    {currentTrack.lyrics}
                  </p>
                )}
              </div>

              <PlayerControls className="w-full max-w-xl" {...controlProps} expanded />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent bottom bar */}
      <AnimatePresence>
        {currentTrack && (
          <motion.footer
            initial={{ y: 96, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-30 border-t border-border/50 bg-card/85 shadow-[0_-8px_30px_-12px_rgb(0_0_0/0.25)] backdrop-blur-xl"
          >
            <QueuePanel open={queueOpen} onClose={() => setQueueOpen(false)} />

            {/* Seek bar spans the full width — always LTR like standard players */}
            <div dir="ltr" className="hidden px-4 pt-2 md:block">
              <Slider
                min={0}
                max={duration || 100}
                value={progress}
                onChange={(e) => seekTo(Number(e.target.value))}
              />
            </div>

            <div className="flex items-center gap-4 px-4 py-2">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {/* Tapping the cover expands the player (mobile-friendly entry point) */}
                <button
                  type="button"
                  onClick={toggleExpanded}
                  aria-label={t("player.expand")}
                  className="relative size-12 shrink-0 overflow-hidden rounded-lg shadow-md transition-transform hover:scale-105"
                >
                  <Image
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {currentTrack.title}
                  </p>
                  <p className="truncate text-xs leading-5 text-muted-foreground">
                    <Link
                      href={routes.artist(currentTrack.artistId)}
                      className="transition-colors hover:text-primary hover:underline"
                    >
                      {currentTrack.artistName}
                    </Link>
                    {currentTrack.albumId && currentTrack.albumName && (
                      <>
                        <span className="mx-1.5">•</span>
                        <Link
                          href={routes.album(currentTrack.albumId)}
                          className="transition-colors hover:text-primary hover:underline"
                        >
                          {currentTrack.albumName}
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                {isGold && (
                  <div className="hidden shrink-0 items-center gap-2 xl:flex">
                    <StatChip
                      icon={<Headphones className="size-3.5" />}
                      label={t("artist.listeners")}
                      value={currentTrack.listenersCount}
                    />
                    <StatChip
                      icon={<Radio className="size-3.5" />}
                      label={t("artist.streams")}
                      value={currentTrack.streamsCount}
                    />
                  </div>
                )}
              </div>

              <PlayerControls className="hidden flex-1 md:flex" {...controlProps} />

              <div className="flex flex-1 items-center justify-end gap-1 md:gap-2">
                <div dir="ltr" className="flex items-center gap-2 md:hidden">
                  <Button variant="ghost" size="icon-sm" onClick={previous}>
                    <SkipBack className="size-4 fill-current" />
                  </Button>
                  <Button
                    variant="default"
                    size="icon"
                    className="rounded-full shadow-lg shadow-primary/25 active:scale-90"
                    onClick={togglePlay}
                  >
                    {isPlaying ? (
                      <Pause className="size-5 fill-current" />
                    ) : (
                      <Play className="size-5 fill-current" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={handleNext}>
                    <SkipForward className="size-4 fill-current" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setQueueOpen((v) => !v)}
                  aria-label={t("player.queue")}
                  aria-expanded={queueOpen}
                  className={cn(queueOpen && "bg-muted text-primary")}
                >
                  <ListMusic className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggleExpanded}
                  aria-label={t("player.expand")}
                  className="hidden md:inline-flex"
                >
                  <Maximize2 className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={closePlayer}
                  aria-label={t("player.close")}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>
    </>
  );
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
}) {
  if (value === undefined) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-2.5 py-1 text-xs tabular-nums text-muted-foreground">
      {icon}
      {formatNumber(value)} {label}
    </span>
  );
}

interface PlayerControlsProps {
  className?: string;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: string;
  isShuffle: boolean;
  expanded?: boolean;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (v: number) => void;
  onToggleMute: () => void;
  onCycleRepeat: () => void;
  onToggleShuffle: () => void;
}

function PlayerControls({
  className,
  isPlaying,
  progress,
  duration,
  volume,
  isMuted,
  repeatMode,
  isShuffle,
  expanded,
  onTogglePlay,
  onPrevious,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onCycleRepeat,
  onToggleShuffle,
}: PlayerControlsProps) {
  return (
    // Transport controls keep LTR order in RTL layouts (prev on the left, next on the right)
    <div dir="ltr" className={cn("flex flex-col items-center gap-2", className)}>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleShuffle}
          className={isShuffle ? "text-primary" : "text-muted-foreground"}
        >
          <Shuffle className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onPrevious}>
          <SkipBack className="size-4 fill-current" />
        </Button>
        <Button
          variant="default"
          size="icon"
          className="size-10 rounded-full shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-90"
          onClick={onTogglePlay}
        >
          {isPlaying ? (
            <Pause className="size-5 fill-current" />
          ) : (
            <Play className="size-5 fill-current" />
          )}
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onNext}>
          <SkipForward className="size-4 fill-current" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onCycleRepeat}
          className={repeatMode !== "off" ? "text-primary" : "text-muted-foreground"}
        >
          {repeatMode === "one" ? (
            <Repeat1 className="size-4" />
          ) : (
            <Repeat className="size-4" />
          )}
        </Button>
      </div>
      {expanded && (
        <div className="flex w-full items-center gap-3 text-xs tabular-nums text-muted-foreground">
          <span>{formatDuration(progress)}</span>
          <Slider
            min={0}
            max={duration || 100}
            value={progress}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="flex-1"
          />
          <span>{formatDuration(duration)}</span>
        </div>
      )}
      {expanded ? (
        <div className="mt-1 flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={onToggleMute}>
            {isMuted || volume === 0 ? (
              <VolumeX className="size-4" />
            ) : (
              <Volume2 className="size-4" />
            )}
          </Button>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="w-32"
          />
        </div>
      ) : (
        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" size="icon-sm" onClick={onToggleMute}>
            {isMuted || volume === 0 ? (
              <VolumeX className="size-4" />
            ) : (
              <Volume2 className="size-4" />
            )}
          </Button>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="w-24"
          />
        </div>
      )}
    </div>
  );
}
