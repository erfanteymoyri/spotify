"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
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
  X,
} from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { routes } from "@/config/site";
import { formatDuration } from "@/lib/format";
import { usePlayerStore } from "@/stores/player-store";
import { useIsMobile } from "@/hooks/use-media-query";
import { Slider } from "@/ui/slider";
import { Button } from "@/ui/button";
import { cn } from "@/lib/utils";

export function MusicPlayer() {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
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

  if (!currentTrack) return null;

  const cycleRepeat = () => {
    const modes = ["off", "all", "one"] as const;
    const idx = modes.indexOf(repeatMode);
    setRepeatMode(modes[(idx + 1) % modes.length]);
  };

  if (isExpanded && !isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-primary/15 via-card to-background p-8"
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
          <Button variant="ghost" size="icon" onClick={toggleExpanded}>
            <Minimize2 className="size-5" />
          </Button>
        </div>
        <div className="mx-auto flex max-w-4xl flex-1 flex-col items-center justify-center gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
            className="relative size-80 overflow-hidden rounded-2xl shadow-2xl shadow-primary/10 ring-1 ring-border/50"
          >
            <Image
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              fill
              className="object-cover"
              priority
            />
          </motion.div>
          <div className="w-full max-w-xl text-center">
            <h2 className="text-3xl font-bold">{currentTrack.title}</h2>
            <Link
              href={routes.artist(currentTrack.artistId)}
              className="mt-3 inline-block text-lg text-muted-foreground transition-colors hover:text-primary hover:underline"
            >
              {currentTrack.artistName}
            </Link>
            {currentTrack.lyrics && (
              <p className="mt-6 max-h-40 overflow-y-auto text-sm leading-7 text-muted-foreground">
                {currentTrack.lyrics}
              </p>
            )}
          </div>
          <PlayerControls
            className="w-full max-w-xl"
            isPlaying={isPlaying}
            progress={progress}
            duration={duration}
            volume={volume}
            isMuted={isMuted}
            repeatMode={repeatMode}
            isShuffle={isShuffle}
            onTogglePlay={togglePlay}
            onPrevious={previous}
            onNext={next}
            onSeek={seekTo}
            onVolumeChange={setVolume}
            onToggleMute={toggleMute}
            onCycleRepeat={cycleRepeat}
            onToggleShuffle={toggleShuffle}
            expanded
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.footer
      initial={{ y: 96, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/50 bg-card/85 shadow-[0_-8px_30px_-12px_rgb(0_0_0/0.25)] backdrop-blur-xl"
    >
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
          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg shadow-md">
            <Image
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{currentTrack.title}</p>
            <Link
              href={routes.artist(currentTrack.artistId)}
              className="truncate text-xs text-muted-foreground transition-colors hover:text-primary hover:underline"
            >
              {currentTrack.artistName}
            </Link>
          </div>
        </div>

        <PlayerControls
          className="hidden flex-1 md:flex"
          isPlaying={isPlaying}
          progress={progress}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          repeatMode={repeatMode}
          isShuffle={isShuffle}
          onTogglePlay={togglePlay}
          onPrevious={previous}
          onNext={next}
          onSeek={seekTo}
          onVolumeChange={setVolume}
          onToggleMute={toggleMute}
          onCycleRepeat={cycleRepeat}
          onToggleShuffle={toggleShuffle}
        />

        <div className="flex flex-1 items-center justify-end gap-1 md:gap-2">
          <div dir="ltr" className="flex items-center gap-2 md:hidden">
            <Button variant="ghost" size="icon-sm" onClick={previous}>
              <SkipBack className="size-4" />
            </Button>
            <Button
              variant="default"
              size="icon"
              className="rounded-full shadow-lg shadow-primary/25"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="size-5" />
              ) : (
                <Play className="size-5 fill-current" />
              )}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={next}>
              <SkipForward className="size-4" />
            </Button>
          </div>
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleExpanded}
              aria-label={t("player.expand")}
            >
              <Maximize2 className="size-4" />
            </Button>
          )}
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
          className="size-10 rounded-full shadow-lg shadow-primary/25 transition-transform hover:scale-105"
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
      {!expanded && (
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
