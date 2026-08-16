"use client";

import { useEffect, useRef } from "react";
import {
  PlaybackEngine,
  type EngineTrack,
} from "@/lib/audio/playback-engine";
import { usePlayerStore, selectNextTrack } from "@/stores/player-store";
import { musicService } from "@/services/music.service";
import type { Track } from "@/types";

/**
 * Binds the playback engine to the store.
 *
 * The engine owns the audio (two decks, hls.js, the crossfade); this hook owns
 * nothing but the wiring — it pushes store changes down and reports engine
 * events back up. Mount it once, from AppProviders.
 *
 * State is read through `getState()` inside callbacks rather than captured from
 * the render closure: the engine outlives any single render, and a stale
 * closure would have it queue the track that was next five minutes ago.
 */
export function useAudioPlayer() {
  const engineRef = useRef<PlaybackEngine | null>(null);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const crossfadeEnabled = usePlayerStore((s) => s.crossfadeEnabled);
  const crossfadeSeconds = usePlayerStore((s) => s.crossfadeSeconds);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const activeLevel = usePlayerStore((s) => s.activeLevel);

  // Declared first so it runs before the effects below on mount: they all
  // expect an engine to exist.
  useEffect(() => {
    const engine = new PlaybackEngine({
      onProgress: (time, duration) => {
        const store = usePlayerStore.getState();
        store.setProgress(time);
        // The manifest is the authority on length; the column on Track is what
        // the uploader's browser reported.
        if (duration && Math.abs(duration - store.duration) > 1) {
          store.setDuration(duration);
        }
      },

      onLevels: (levels) => usePlayerStore.getState().setQualityLevels(levels),

      onTrackCompleted: (trackId, seconds) => {
        // Fire-and-forget: the server decides whether the play counts, and a
        // rejection (the free tier's daily cap, most often) must not interrupt
        // the audio that has already been heard.
        void musicService.recordStream(trackId, seconds).catch(() => {});
      },

      onEnded: () => {
        const store = usePlayerStore.getState();
        // Repeat-one has to be served at the audio layer: `isPlaying` is
        // already true, so setting it again would not restart anything.
        if (store.repeatMode === "one") {
          engine.seek(0);
          store.setProgress(0);
          engine.play();
          return;
        }
        store.next(true);
      },

      onAdvanced: (trackId) => {
        const store = usePlayerStore.getState();
        const track = store.queue.find((t) => t.id === trackId);
        // The engine is already playing this deck; `advanceTo` moves the UI
        // onto it without asking for a reload.
        if (track) store.advanceTo(track);
      },

      onError: (message) => {
        // Not surfaced to the listener: every path that reports here has
        // already fallen back to something playable.
        console.warn("[player]", message);
      },

      peekNext: (): EngineTrack | null => {
        const store = usePlayerStore.getState();
        // Repeat-one means "this track again"; crossfading a track into itself
        // would just be a five-second echo.
        if (store.repeatMode === "one") return null;
        const next = selectNextTrack(store, true);
        return next ? toEngineTrack(next) : null;
      },
    });

    engineRef.current = engine;

    // Both are engine-level operations, so the store holds only a stub until
    // a player exists — same arrangement `seekTo` already used.
    usePlayerStore.setState({
      seekTo: (time: number) => {
        engine.seek(time);
        usePlayerStore.getState().setProgress(time);
      },
      selectLevel: (index: number) => {
        engine.setQuality(index);
        usePlayerStore.setState({ activeLevel: index });
      },
    });

    return () => {
      engine.destroy();
      engineRef.current = null;
      usePlayerStore.setState({ seekTo: () => {}, selectLevel: () => {} });
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setTrack(currentTrack ? toEngineTrack(currentTrack) : null);
  }, [currentTrack]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (isPlaying) engine.play();
    else engine.pause();
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    engineRef.current?.setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  useEffect(() => {
    engineRef.current?.setCrossfade({
      // Repeat-one and crossfade are mutually exclusive by definition, and the
      // engine should not have to know why.
      enabled: crossfadeEnabled && repeatMode !== "one",
      seconds: crossfadeSeconds,
    });
  }, [crossfadeEnabled, crossfadeSeconds, repeatMode]);

  useEffect(() => {
    engineRef.current?.setQuality(activeLevel);
  }, [activeLevel]);
}

function toEngineTrack(track: Track): EngineTrack {
  return {
    id: track.id,
    // Null unless the package is ready, which is exactly when the deck should
    // fall back to the original upload.
    hlsUrl: track.hls?.masterUrl ?? null,
    progressiveUrl: track.audioUrl,
  };
}
