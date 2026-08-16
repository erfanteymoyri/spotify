import { create } from "zustand";
import { AUTO_LEVEL, type QualityLevel } from "@/lib/audio/deck";
import type { QualityPreference, RepeatMode, Track } from "@/types";

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  isExpanded: boolean;

  /** Blend the end of each track into the start of the next one. */
  crossfadeEnabled: boolean;
  /** Length of that blend, in seconds. Server-configured; 5 by default. */
  crossfadeSeconds: number;

  /**
   * Qualities the current track is actually available in, as reported by
   * hls.js after it parses the master playlist.
   *
   * Empty means there is nothing to choose between — the track has no package,
   * or the browser is playing HLS natively and exposes no level API — and the
   * menu hides itself rather than offering a switch that does nothing.
   */
  qualityLevels: QualityLevel[];
  /** Selected level index, or `AUTO_LEVEL` (-1) to let hls.js adapt. */
  activeLevel: number;
  /** The listener's stored preference, re-applied to every new track. */
  qualityPreference: QualityPreference;

  playTrack: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  pause: () => void;
  play: () => void;
  /**
   * Advance to the next track. `fromAutoplay` marks calls made when a track
   * ends naturally — only those honor repeat-one; a manual click always skips.
   */
  next: (fromAutoplay?: boolean) => void;
  previous: () => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  toggleExpanded: () => void;
  /** Drop a track from the upcoming queue (current track stays untouched) */
  removeFromQueue: (trackId: string) => void;
  /** Stop playback and dismiss the player bar entirely */
  closePlayer: () => void;
  seekTo: (time: number) => void;

  setCrossfade: (enabled: boolean, seconds?: number) => void;
  setQualityLevels: (levels: QualityLevel[]) => void;
  setQualityPreference: (preference: QualityPreference) => void;
  /** Bound by the audio hook, like `seekTo`: only the engine can switch level. */
  selectLevel: (index: number) => void;
  /**
   * Make `track` current *without* restarting playback.
   *
   * The crossfade path: the engine has already been playing this track for the
   * last few seconds on its other deck, so the usual "current track changed,
   * load it" reaction would cut off the very handover that just finished.
   */
  advanceTo: (track: Track) => void;
}

/**
 * Which track follows the current one, or `null` when playback should stop.
 *
 * Extracted so that skipping and crossfading cannot drift apart: the blend has
 * to start with the same track a click on "next" would have produced, and with
 * shuffle on that is a decision, not a lookup.
 */
export function selectNextTrack(
  state: Pick<
    PlayerState,
    "queue" | "currentTrack" | "repeatMode" | "isShuffle"
  >,
  fromAutoplay = false,
): Track | null {
  const { queue, currentTrack, repeatMode, isShuffle } = state;
  if (!currentTrack || queue.length === 0) return null;

  const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);

  if (isShuffle) {
    // Avoid re-picking the current track when there are alternatives
    let nextIndex: number;
    do {
      nextIndex = Math.floor(Math.random() * queue.length);
    } while (queue.length > 1 && nextIndex === currentIndex);
    return queue[nextIndex];
  }

  const nextIndex = currentIndex + 1;
  if (nextIndex < queue.length) return queue[nextIndex];

  // Queue finished. A natural end with repeat off stops; a manual skip wraps.
  if (repeatMode === "off" && fromAutoplay) return null;
  return queue[0];
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  progress: 0,
  duration: 0,
  volume: 0.75,
  isMuted: false,
  repeatMode: "off",
  isShuffle: false,
  isExpanded: false,

  crossfadeEnabled: false,
  crossfadeSeconds: 5,
  qualityLevels: [],
  activeLevel: AUTO_LEVEL,
  qualityPreference: "auto",

  playTrack: (track, queue) => {
    const trackQueue = queue ?? [track];
    set({
      currentTrack: track,
      queue: trackQueue,
      isPlaying: true,
      progress: 0,
      duration: track.duration,
      // The new track brings its own manifest; keeping the old list would let
      // the menu offer a level that does not exist here.
      qualityLevels: [],
    });
  },

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  pause: () => set({ isPlaying: false }),
  play: () => set({ isPlaying: true }),

  // Repeat-one autoplay is handled in the audio hook; here `fromAutoplay`
  // only distinguishes a natural end (stop at queue end) from a manual skip.
  next: (fromAutoplay = false) => {
    const state = get();
    const { currentTrack, queue, seekTo } = state;
    if (!currentTrack || queue.length === 0) return;

    const nextTrack = selectNextTrack(state, fromAutoplay);
    if (!nextTrack) {
      // Queue finished with repeat off — stop playback
      set({ isPlaying: false });
      return;
    }

    if (nextTrack.id === currentTrack.id) {
      // Same track (single-item queue) — restart the audio instead of reloading
      seekTo(0);
      set({ isPlaying: true });
      return;
    }

    set({
      currentTrack: nextTrack,
      progress: 0,
      duration: nextTrack.duration,
      isPlaying: true,
      qualityLevels: [],
    });
  },

  previous: () => {
    const { queue, currentTrack, progress, seekTo } = get();
    if (!currentTrack) return;

    // Past the 3-second grace window (or nothing to go back to) — restart
    if (progress > 3 || queue.length <= 1) {
      seekTo(0);
      set({ isPlaying: true });
      return;
    }

    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
    const prevTrack = queue[prevIndex];

    if (prevTrack.id === currentTrack.id) {
      seekTo(0);
      set({ isPlaying: true });
      return;
    }

    set({
      currentTrack: prevTrack,
      progress: 0,
      duration: prevTrack.duration,
      isPlaying: true,
      qualityLevels: [],
    });
  },

  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
  toggleMute: () =>
    set((s) => ({ isMuted: !s.isMuted })),
  setRepeatMode: (mode) => set({ repeatMode: mode }),
  toggleShuffle: () => set((s) => ({ isShuffle: !s.isShuffle })),
  toggleExpanded: () => set((s) => ({ isExpanded: !s.isExpanded })),

  removeFromQueue: (trackId) =>
    set((s) => {
      if (s.currentTrack?.id === trackId) return s;
      return { queue: s.queue.filter((t) => t.id !== trackId) };
    }),
  closePlayer: () =>
    set({
      currentTrack: null,
      queue: [],
      isPlaying: false,
      progress: 0,
      duration: 0,
      isExpanded: false,
      qualityLevels: [],
    }),
  seekTo: () => {},

  setCrossfade: (enabled, seconds) =>
    set((s) => ({
      crossfadeEnabled: enabled,
      crossfadeSeconds: seconds ?? s.crossfadeSeconds,
    })),

  setQualityLevels: (levels) =>
    set((s) => ({
      qualityLevels: levels,
      // A stored preference is a *rung*, but hls.js addresses levels by index,
      // and the index of a rung depends on how many the track actually has.
      // Resolving it here — once, against the manifest we just received —
      // keeps that translation out of both the engine and the menu.
      activeLevel: resolveLevel(levels, s.qualityPreference),
    })),

  setQualityPreference: (preference) =>
    set((s) => ({
      qualityPreference: preference,
      activeLevel: resolveLevel(s.qualityLevels, preference),
    })),

  selectLevel: () => {},

  advanceTo: (track) =>
    set({
      currentTrack: track,
      progress: 0,
      duration: track.duration,
      isPlaying: true,
      qualityLevels: [],
    }),
}));

/**
 * Turn a stored preference into an hls.js level index for *this* track.
 *
 * Matching on bitrate rather than position: the ladder is server
 * configuration, so "high" is whichever level carries the most data here, not
 * "the third one". A preference the track cannot honour falls back to Auto
 * rather than to silence.
 */
export function resolveLevel(
  levels: QualityLevel[],
  preference: QualityPreference,
): number {
  if (preference === "auto" || levels.length === 0) return AUTO_LEVEL;

  const ascending = [...levels].sort((a, b) => a.bitrateKbps - b.bitrateKbps);
  const chosen =
    preference === "low"
      ? ascending[0]
      : preference === "high"
        ? ascending[ascending.length - 1]
        : ascending[Math.floor((ascending.length - 1) / 2)];

  return chosen?.index ?? AUTO_LEVEL;
}

/**
 * The inverse: which rung a given level index represents on this track.
 *
 * Lets the menu offer the levels hls.js actually parsed while still storing a
 * preference that means something on the *next* track, whose ladder may be a
 * different length.
 */
export function preferenceForLevel(
  levels: QualityLevel[],
  index: number,
): QualityPreference {
  if (index === AUTO_LEVEL || levels.length === 0) return "auto";

  const ascending = [...levels].sort((a, b) => a.bitrateKbps - b.bitrateKbps);
  const position = ascending.findIndex((level) => level.index === index);

  if (position <= 0) return "low";
  if (position === ascending.length - 1) return "high";
  return "standard";
}
