import { beforeEach, describe, expect, it } from "vitest";
import { usePlayerStore } from "@/stores/player-store";
import { makeQueue, makeTrack } from "../helpers";

function reset() {
  usePlayerStore.setState(usePlayerStore.getInitialState(), true);
}

beforeEach(reset);

describe("playTrack", () => {
  it("sets the current track, queue and starts playing", () => {
    const queue = makeQueue(3);
    usePlayerStore.getState().playTrack(queue[1], queue);

    const s = usePlayerStore.getState();
    expect(s.currentTrack?.id).toBe("track-2");
    expect(s.queue).toHaveLength(3);
    expect(s.isPlaying).toBe(true);
    expect(s.progress).toBe(0);
  });

  it("defaults the queue to just the played track", () => {
    usePlayerStore.getState().playTrack(makeTrack("solo"));
    expect(usePlayerStore.getState().queue).toEqual([
      expect.objectContaining({ id: "solo" }),
    ]);
  });
});

describe("next", () => {
  it("advances to the following track", () => {
    const queue = makeQueue(3);
    const store = usePlayerStore.getState();
    store.playTrack(queue[0], queue);
    store.next();
    expect(usePlayerStore.getState().currentTrack?.id).toBe("track-2");
  });

  it("stops at the end of the queue on natural end with repeat off", () => {
    const queue = makeQueue(2);
    const store = usePlayerStore.getState();
    store.playTrack(queue[1], queue);
    store.next(true); // fromAutoplay

    const s = usePlayerStore.getState();
    expect(s.isPlaying).toBe(false);
    expect(s.currentTrack?.id).toBe("track-2");
  });

  it("wraps to the first track on a manual skip at the end", () => {
    const queue = makeQueue(2);
    const store = usePlayerStore.getState();
    store.playTrack(queue[1], queue);
    store.next(); // manual
    expect(usePlayerStore.getState().currentTrack?.id).toBe("track-1");
  });

  it("wraps around at the end when repeat-all is on", () => {
    const queue = makeQueue(2);
    const store = usePlayerStore.getState();
    store.playTrack(queue[1], queue);
    store.setRepeatMode("all");
    store.next(true);
    expect(usePlayerStore.getState().currentTrack?.id).toBe("track-1");
  });
});

describe("previous", () => {
  it("restarts the track when more than 3s elapsed", () => {
    const queue = makeQueue(3);
    const store = usePlayerStore.getState();
    store.playTrack(queue[1], queue);
    store.setProgress(10);
    store.previous();
    expect(usePlayerStore.getState().currentTrack?.id).toBe("track-2");
  });

  it("goes to the previous track within the grace window", () => {
    const queue = makeQueue(3);
    const store = usePlayerStore.getState();
    store.playTrack(queue[1], queue);
    store.setProgress(1);
    store.previous();
    expect(usePlayerStore.getState().currentTrack?.id).toBe("track-1");
  });
});

describe("repeat & shuffle toggles", () => {
  it("cycles repeat mode and toggles shuffle flags", () => {
    const store = usePlayerStore.getState();
    expect(usePlayerStore.getState().repeatMode).toBe("off");
    store.setRepeatMode("one");
    expect(usePlayerStore.getState().repeatMode).toBe("one");

    store.toggleShuffle();
    expect(usePlayerStore.getState().isShuffle).toBe(true);
  });
});

describe("volume", () => {
  it("mutes automatically when volume hits zero", () => {
    const store = usePlayerStore.getState();
    store.setVolume(0);
    expect(usePlayerStore.getState().isMuted).toBe(true);

    store.setVolume(0.5);
    expect(usePlayerStore.getState().isMuted).toBe(false);
  });
});

describe("removeFromQueue", () => {
  it("removes an upcoming track but never the current one", () => {
    const queue = makeQueue(3);
    const store = usePlayerStore.getState();
    store.playTrack(queue[0], queue);

    store.removeFromQueue("track-2");
    expect(usePlayerStore.getState().queue.map((t) => t.id)).toEqual([
      "track-1",
      "track-3",
    ]);

    store.removeFromQueue("track-1"); // current — must be ignored
    expect(usePlayerStore.getState().queue).toHaveLength(2);
  });
});

describe("closePlayer", () => {
  it("clears the current track and stops playback", () => {
    const queue = makeQueue(2);
    const store = usePlayerStore.getState();
    store.playTrack(queue[0], queue);
    store.closePlayer();

    const s = usePlayerStore.getState();
    expect(s.currentTrack).toBeNull();
    expect(s.queue).toHaveLength(0);
    expect(s.isPlaying).toBe(false);
  });
});
