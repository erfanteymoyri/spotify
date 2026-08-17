/**
 * The handover state machine, driven against a fake `<audio>` element.
 *
 * jsdom's media element is a stub — `play`, `load` and `readyState` do nothing
 * — so the engine is given one that behaves: a clock the test advances by hand
 * and a `timeupdate` it fires, which is exactly the surface the engine reacts
 * to. That makes the property these tests exist for testable at all: that the
 * blend lasts its whole window, with both decks moving through it, rather than
 * collapsing into a cut because the incoming track was still loading.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlaybackEngine, type EngineTrack } from "@/lib/audio/playback-engine";

const FADE_SECONDS = 5;
const DURATION = 120;

class FakeAudio extends EventTarget {
  preload = "none";
  src = "";
  volume = 1;
  paused = true;
  ended = false;
  duration = NaN;
  currentTime = 0;
  /** HAVE_NOTHING until a source is attached, HAVE_ENOUGH_DATA after. */
  readyState = 0;
  error: MediaError | null = null;

  load() {
    // A real element buffers asynchronously; the fake is generous on purpose,
    // so a test that still sees a late load is seeing a bug and not a race.
    this.readyState = 4;
    this.duration = DURATION;
    this.currentTime = 0;
    this.dispatchEvent(new Event("loadedmetadata"));
  }

  play() {
    this.paused = false;
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }

  removeAttribute() {
    this.src = "";
    this.readyState = 0;
  }

  canPlayType() {
    return "";
  }

  /** Move this deck's clock and let the engine react, as a real one would. */
  seekTo(seconds: number) {
    this.currentTime = seconds;
    this.dispatchEvent(new Event("timeupdate"));
  }
}

/** Let the `load` / `whenReady` promise chain in `prepareHandover` settle. */
async function flush() {
  for (let i = 0; i < 8; i++) await Promise.resolve();
}

function track(id: string): EngineTrack {
  return { id, hlsUrl: null, progressiveUrl: `/audio/${id}.mp3` };
}

describe("PlaybackEngine crossfade", () => {
  let elements: FakeAudio[];
  let engine: PlaybackEngine;
  let advanced: string[];

  /** The deck the listener is hearing most of, and the one coming in. */
  const outgoing = () => elements[0];
  const incoming = () => elements[1];

  beforeEach(() => {
    vi.useFakeTimers();
    elements = [];
    advanced = [];

    vi.stubGlobal(
      "Audio",
      class extends FakeAudio {
        constructor() {
          super();
          elements.push(this);
        }
      },
    );

    engine = new PlaybackEngine({
      onProgress: () => {},
      onLevels: () => {},
      onTrackCompleted: () => {},
      onEnded: () => {},
      onAdvanced: (id) => advanced.push(id),
      onError: () => {},
      peekNext: () => track("b"),
    });

    engine.setCrossfade({ enabled: true, seconds: FADE_SECONDS });
    engine.setVolume(1);
    engine.setTrack(track("a"));
    engine.play();
  });

  afterEach(() => {
    engine.destroy();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("buffers the next track before the blend is due, silently", async () => {
    // Ten seconds out: inside the preload lead, well outside the fade window.
    outgoing().seekTo(DURATION - 10);
    await flush();

    expect(incoming().src).toContain("b.mp3");
    // Loaded, but not yet part of what anyone can hear.
    expect(incoming().paused).toBe(true);
    expect(incoming().volume).toBe(0);
    expect(outgoing().volume).toBe(1);
  });

  it("runs the blend across the whole window, not just its end", async () => {
    outgoing().seekTo(DURATION - 10);
    await flush();

    outgoing().seekTo(DURATION - FADE_SECONDS);
    expect(incoming().paused).toBe(false);
    expect(incoming().volume).toBeCloseTo(0, 2);
    expect(outgoing().volume).toBeCloseTo(1, 2);

    // A quarter in, both decks have moved and neither is at an extreme.
    outgoing().seekTo(DURATION - 3.75);
    expect(outgoing().volume).toBeLessThan(1);
    expect(outgoing().volume).toBeGreaterThan(0.7);
    expect(incoming().volume).toBeGreaterThan(0);
    expect(incoming().volume).toBeLessThan(0.7);

    // Half way, the equal-power crossing point.
    outgoing().seekTo(DURATION - 2.5);
    expect(outgoing().volume).toBeCloseTo(Math.SQRT1_2, 2);
    expect(incoming().volume).toBeCloseTo(Math.SQRT1_2, 2);
  });

  it("keeps fading between the outgoing deck's own ticks", async () => {
    outgoing().seekTo(DURATION - 10);
    await flush();
    outgoing().seekTo(DURATION - FADE_SECONDS);

    const atStart = outgoing().volume;

    // No `timeupdate` at all — a real element only offers about four a second,
    // which is too coarse to hear as a fade. The engine's own ramp has to
    // cover the gaps.
    outgoing().currentTime = DURATION - FADE_SECONDS / 2;
    vi.advanceTimersByTime(100);

    expect(outgoing().volume).toBeLessThan(atStart);
    expect(incoming().volume).toBeGreaterThan(0);
  });

  it("hands over once the window closes", async () => {
    outgoing().seekTo(DURATION - 10);
    await flush();
    outgoing().seekTo(DURATION - FADE_SECONDS);
    outgoing().seekTo(DURATION);

    expect(advanced).toEqual(["b"]);
    // The incoming deck carries on alone, at full gain.
    expect(incoming().volume).toBe(1);
    expect(incoming().paused).toBe(false);
  });

  it("abandons the blend when crossfade is switched off mid-fade", async () => {
    outgoing().seekTo(DURATION - 10);
    await flush();
    outgoing().seekTo(DURATION - 2.5);
    expect(incoming().paused).toBe(false);

    engine.setCrossfade({ enabled: false, seconds: FADE_SECONDS });

    expect(incoming().paused).toBe(true);
    // The track still playing is restored to full volume rather than left
    // part-way down the curve it was on.
    expect(outgoing().volume).toBe(1);
    expect(advanced).toEqual([]);
  });

  it("leaves a track shorter than the window alone", async () => {
    outgoing().duration = FADE_SECONDS;
    outgoing().seekTo(1);
    await flush();

    // Blending five seconds of a five-second track would mean never hearing it.
    expect(incoming().src).toBe("");
  });
});
