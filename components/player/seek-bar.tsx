"use client";

import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/stores/player-store";
import { Slider } from "@/ui/slider";

/**
 * The seek bar, and the only component that reads `progress`.
 *
 * That isolation is the point. Playback writes the position into the store
 * roughly four times a second, and any component subscribed to it re-renders
 * just as often. Reading it here — rather than in `MusicPlayer`, which owns the
 * artwork, the queue panel and two `AnimatePresence` trees — keeps that
 * four-times-a-second work down to one range input.
 */
export function SeekBar({
  withTimes = false,
  className,
}: {
  /** Flank the bar with elapsed/total, as the full-screen view does. */
  withTimes?: boolean;
  className?: string;
}) {
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  // Rebound once by the audio hook when the engine mounts; stable after that.
  const seekTo = usePlayerStore((s) => s.seekTo);

  const slider = (
    <Slider
      min={0}
      max={duration || 100}
      value={progress}
      onChange={(e) => seekTo(Number(e.target.value))}
      className={withTimes ? "flex-1" : undefined}
    />
  );

  if (!withTimes) {
    // Always LTR — media sliders keep their direction in RTL layouts.
    return (
      <div dir="ltr" className={className}>
        {slider}
      </div>
    );
  }

  return (
    <div
      dir="ltr"
      className={cn(
        "flex w-full items-center gap-3 text-xs tabular-nums text-muted-foreground",
        className,
      )}
    >
      <span>{formatDuration(progress)}</span>
      {slider}
      <span>{formatDuration(duration)}</span>
    </div>
  );
}
