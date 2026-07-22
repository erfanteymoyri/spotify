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
  next: () => void;
  previous: () => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  toggleExpanded: () => void;
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

  next: () => {
    const { queue, currentTrack, repeatMode, isShuffle } = get();
    if (!currentTrack || queue.length === 0) return;

    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);

    if (repeatMode === "one") {
      set({ progress: 0, isPlaying: true });
      return;
    }

    let nextIndex: number;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === "all") {
          nextIndex = 0;
        } else {
          set({ isPlaying: false });
          return;
        }
      }
    }

    const nextTrack = queue[nextIndex];
    set({
      currentTrack: nextTrack,
      progress: 0,
      duration: nextTrack.duration,
      isPlaying: true,
    });
  },

  previous: () => {
    const { queue, currentTrack, progress } = get();
    if (!currentTrack) return;

    if (progress > 3) {
      set({ progress: 0 });
      return;
    }

    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
    const prevTrack = queue[prevIndex];
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
