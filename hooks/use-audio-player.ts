"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/stores/player-store";
import { musicService } from "@/services/music.service";

/**
 * Audio player hook — manages the HTML audio element.
 * Mount once via AppProviders; MusicPlayer reads seekTo from the store.
 */
export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    setProgress,
    setDuration,
  } = usePlayerStore();

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    usePlayerStore.setState({
      seekTo: (time: number) => {
        audio.currentTime = time;
        setProgress(time);
      },
    });

    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      const track = usePlayerStore.getState().currentTrack;
      if (track) {
        musicService.recordStream(track.id, audio.duration);
      }
      // Natural end — repeat-one loops here, unlike a manual skip
      usePlayerStore.getState().next(true);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      usePlayerStore.setState({ seekTo: () => {} });
    };
  }, [setProgress, setDuration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Player was closed — stop playback and release the source
    if (!currentTrack) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      return;
    }

    audio.src = currentTrack.audioUrl;
    audio.load();
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);
}
