"use client";

import Link from "next/link";
import Image from "next/image";
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
} from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { routes } from "@/config/site";
import { formatDuration } from "@/lib/format";
import { usePlayerStore } from "@/stores/player-store";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { useIsMobile } from "@/hooks/use-media-query";
import { Slider } from "@/ui/slider";
import { Button } from "@/ui/button";
import { cn } from "@/lib/utils";

export function MusicPlayer() {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const { seek } = useAudioPlayer();
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
  } = usePlayerStore();

  if (!currentTrack) {
    return (
      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3 backdrop-blur">
        <p className="text-center text-sm text-muted-foreground">
          {t("player.selectTrack")}
        </p>
      </footer>
    );
  }

  const cycleRepeat = () => {
    const modes = ["off", "all", "one"] as const;
    const idx = modes.indexOf(repeatMode);
    setRepeatMode(modes[(idx + 1) % modes.length]);
  };

  if (isExpanded && !isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-card to-background p-8">
        <div className="flex justify-end">
          <Button variant="ghost" size="icon" onClick={toggleExpanded}>
            <Minimize2 className="size-5" />
          </Button>
        </div>
        <div className="mx-auto flex max-w-4xl flex-1 flex-col items-center justify-center gap-8">
          <div className="relative size-80 overflow-hidden rounded-lg shadow-2xl">
            <Image
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="w-full max-w-xl text-center">
            <h2 className="text-3xl font-bold">{currentTrack.title}</h2>
            <Link
              href={routes.artist(currentTrack.artistId)}
              className="mt-2 inline-block text-lg text-muted-foreground hover:underline"
            >
              {currentTrack.artistName}
            </Link>
            {currentTrack.lyrics && (
              <p className="mt-6 max-h-40 overflow-y-auto text-sm leading-relaxed text-muted-foreground">
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
            onSeek={seek}
            onVolumeChange={setVolume}
            onToggleMute={toggleMute}
            onCycleRepeat={cycleRepeat}
            onToggleShuffle={toggleShuffle}
            expanded
          />
        </div>
      </div>
    );
  }

  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
      <div className="hidden px-4 pt-2 md:block">
        <Slider
          min={0}
          max={duration || 100}
          value={progress}
          onChange={(e) => seek(Number(e.target.value))}
          className="h-1"
        />
      </div>
      <div className="flex items-center gap-4 px-4 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-md">
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
              className="truncate text-xs text-muted-foreground hover:underline"
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
          onSeek={seek}
          onVolumeChange={setVolume}
          onToggleMute={toggleMute}
          onCycleRepeat={cycleRepeat}
          onToggleShuffle={toggleShuffle}
        />

        <div className="flex flex-1 items-center justify-end gap-1 md:gap-2">
          {!isMobile && (
            <Button variant="ghost" size="icon-sm" onClick={toggleExpanded}>
              <Maximize2 className="size-4" />
            </Button>
          )}
          <div className="flex items-center gap-2 md:hidden">
            <Button variant="ghost" size="icon-sm" onClick={previous}>
              <SkipBack className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={togglePlay}>
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
        </div>
      </div>
    </footer>
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
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleShuffle}
          className={isShuffle ? "text-primary" : ""}
        >
          <Shuffle className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onPrevious}>
          <SkipBack className="size-4" />
        </Button>
        <Button
          variant="default"
          size="icon"
          className="size-9 rounded-full"
          onClick={onTogglePlay}
        >
          {isPlaying ? (
            <Pause className="size-5" />
          ) : (
            <Play className="size-5 fill-current" />
          )}
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onNext}>
          <SkipForward className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onCycleRepeat}
          className={repeatMode !== "off" ? "text-primary" : ""}
        >
          {repeatMode === "one" ? (
            <Repeat1 className="size-4" />
          ) : (
            <Repeat className="size-4" />
          )}
        </Button>
      </div>
      {expanded && (
        <div className="flex w-full items-center gap-2 text-xs text-muted-foreground">
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
