import { beforeEach, describe, expect, it } from "vitest";
import { AUTO_LEVEL, type QualityLevel } from "@/lib/audio/deck";
import {
  preferenceForLevel,
  resolveLevel,
  selectNextTrack,
  usePlayerStore,
} from "@/stores/player-store";
import { makeQueue } from "../helpers";

/**
 * hls.js hands back levels in manifest order, which is not necessarily
 * bitrate order — so the fixture deliberately is not sorted.
 */
const LEVELS: QualityLevel[] = [
  { index: 0, label: "128 kbps", bitrateKbps: 128 },
  { index: 1, label: "320 kbps", bitrateKbps: 320 },
  { index: 2, label: "64 kbps", bitrateKbps: 64 },
];

function reset() {
  usePlayerStore.setState(usePlayerStore.getInitialState(), true);
}

beforeEach(reset);

describe("resolveLevel", () => {
  it("maps a rung to the level carrying that bitrate, not to a position", () => {
    expect(resolveLevel(LEVELS, "low")).toBe(2);
    expect(resolveLevel(LEVELS, "standard")).toBe(0);
    expect(resolveLevel(LEVELS, "high")).toBe(1);
  });

  it("hands the choice back to hls.js on auto", () => {
    expect(resolveLevel(LEVELS, "auto")).toBe(AUTO_LEVEL);
  });

  it("falls back to auto when the track has no ladder", () => {
    // An unpackaged track, or native HLS playback with no level API: the
    // preference cannot be honoured and must not select level 0 by accident.
    expect(resolveLevel([], "high")).toBe(AUTO_LEVEL);
  });

  it("survives a shorter ladder", () => {
    const twoRungs = LEVELS.filter((level) => level.bitrateKbps !== 128);
    expect(resolveLevel(twoRungs, "standard")).toBe(2); // the 64 kbps rung
    expect(resolveLevel(twoRungs, "high")).toBe(1);
  });
});

describe("preferenceForLevel", () => {
  it("is the inverse of resolveLevel", () => {
    for (const preference of ["low", "standard", "high"] as const) {
      expect(preferenceForLevel(LEVELS, resolveLevel(LEVELS, preference))).toBe(
        preference,
      );
    }
  });

  it("reads -1 as auto", () => {
    expect(preferenceForLevel(LEVELS, AUTO_LEVEL)).toBe("auto");
  });
});

describe("quality state", () => {
  it("re-resolves the stored preference against each new manifest", () => {
    const store = usePlayerStore.getState();
    store.setQualityPreference("high");
    // Nothing to resolve against yet.
    expect(usePlayerStore.getState().activeLevel).toBe(AUTO_LEVEL);

    store.setQualityLevels(LEVELS);
    expect(usePlayerStore.getState().activeLevel).toBe(1);
  });

  it("keeps the preference when the queue advances to a new track", () => {
    const store = usePlayerStore.getState();
    store.setQualityLevels(LEVELS);
    store.setQualityPreference("low");

    // A track change clears the ladder; the choice has to outlive it.
    usePlayerStore.getState().setQualityLevels([]);
    expect(usePlayerStore.getState().qualityPreference).toBe("low");

    usePlayerStore.getState().setQualityLevels(LEVELS);
    expect(usePlayerStore.getState().activeLevel).toBe(2);
  });

  it("drops the ladder when the track changes", () => {
    const queue = makeQueue(2);
    const store = usePlayerStore.getState();
    store.playTrack(queue[0], queue);
    store.setQualityLevels(LEVELS);

    usePlayerStore.getState().next();

    // Offering the previous track's levels would let the menu switch to a
    // variant that does not exist on this one.
    expect(usePlayerStore.getState().qualityLevels).toEqual([]);
  });
});

describe("selectNextTrack", () => {
  it("agrees with what `next` would have played", () => {
    const queue = makeQueue(3);
    const store = usePlayerStore.getState();
    store.playTrack(queue[0], queue);

    const peeked = selectNextTrack(usePlayerStore.getState(), true);
    usePlayerStore.getState().next(true);

    expect(usePlayerStore.getState().currentTrack?.id).toBe(peeked?.id);
  });

  it("returns null at the end of the queue with repeat off", () => {
    // Which is how the engine knows there is nothing to crossfade into.
    const queue = makeQueue(2);
    const store = usePlayerStore.getState();
    store.playTrack(queue[1], queue);

    expect(selectNextTrack(usePlayerStore.getState(), true)).toBeNull();
  });

  it("wraps at the end when repeat-all is on", () => {
    const queue = makeQueue(2);
    const store = usePlayerStore.getState();
    store.playTrack(queue[1], queue);
    store.setRepeatMode("all");

    expect(selectNextTrack(usePlayerStore.getState(), true)?.id).toBe("track-1");
  });
});

describe("advanceTo", () => {
  it("moves the UI onto a track the engine is already playing", () => {
    const queue = makeQueue(2);
    const store = usePlayerStore.getState();
    store.playTrack(queue[0], queue);
    store.setProgress(180);

    usePlayerStore.getState().advanceTo(queue[1]);

    const state = usePlayerStore.getState();
    expect(state.currentTrack?.id).toBe("track-2");
    expect(state.progress).toBe(0);
    expect(state.isPlaying).toBe(true);
  });
});
