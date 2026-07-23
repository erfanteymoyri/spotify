import { create } from "zustand";
import type { RepeatMode, Track } from "@/types";

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

  playTrack: (track, queue) => {
    const trackQueue = queue ?? [track];
    set({
      currentTrack: track,
      queue: trackQueue,
      isPlaying: true,
      progress: 0,
      duration: track.duration,
    });
  },

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  pause: () => set({ isPlaying: false }),
  play: () => set({ isPlaying: true }),

  next: (fromAutoplay = false) => {
    const { queue, currentTrack, repeatMode, isShuffle, seekTo } = get();
    if (!currentTrack || queue.length === 0) return;

    // Repeat-one only loops on natural track end; manual skips move on
    if (fromAutoplay && repeatMode === "one") {
      seekTo(0);
      set({ isPlaying: true });
      return;
    }

    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);

    let nextIndex: number;
    if (isShuffle) {
      // Avoid re-picking the current track when there are alternatives
      do {
        nextIndex = Math.floor(Math.random() * queue.length);
      } while (queue.length > 1 && nextIndex === currentIndex);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === "off" && fromAutoplay) {
          // Queue finished with repeat off — stop playback
          set({ isPlaying: false });
          return;
        }
        nextIndex = 0;
      }
    }

    const nextTrack = queue[nextIndex];
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
    }),
  seekTo: () => {},
}));
