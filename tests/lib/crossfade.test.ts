import { describe, expect, it } from "vitest";
import { equalPowerGains, fadeProgress } from "@/lib/audio/playback-engine";

describe("fadeProgress", () => {
  it("is 0 when the blend has just begun and 1 at the handover", () => {
    expect(fadeProgress(5, 5)).toBe(0);
    expect(fadeProgress(0, 5)).toBe(1);
  });

  it("tracks how much of the track is left, not wall-clock time", () => {
    // Half the window remaining is half way through the blend, however long
    // the tick that observed it took to arrive.
    expect(fadeProgress(2.5, 5)).toBeCloseTo(0.5, 5);
  });

  it("stays at 0 while the length is still unknown", () => {
    // `remaining` is Infinity until metadata loads; a fade must not begin on
    // a track whose end we cannot locate.
    expect(fadeProgress(Infinity, 5)).toBe(0);
  });

  it("clamps rather than overshooting past the end", () => {
    expect(fadeProgress(-3, 5)).toBe(1);
    expect(fadeProgress(30, 5)).toBe(0);
  });
});

describe("equalPowerGains", () => {
  it("starts on the outgoing track alone and ends on the incoming one", () => {
    expect(equalPowerGains(0)).toEqual({ outgoing: 1, incoming: 0 });

    const end = equalPowerGains(1);
    expect(end.outgoing).toBeCloseTo(0, 10);
    expect(end.incoming).toBeCloseTo(1, 10);
  });

  it("holds total power constant across the blend", () => {
    // The reason for cos/sin over a linear ramp: two uncorrelated signals sum
    // in power, so a linear pair dips audibly at the midpoint where both sit
    // at 0.5. Here the sum of squares is 1 the whole way through.
    for (let step = 0; step <= 10; step++) {
      const { outgoing, incoming } = equalPowerGains(step / 10);
      expect(outgoing ** 2 + incoming ** 2).toBeCloseTo(1, 10);
    }
  });

  it("crosses at equal loudness rather than at half volume", () => {
    const middle = equalPowerGains(0.5);
    expect(middle.outgoing).toBeCloseTo(Math.SQRT1_2, 10);
    expect(middle.incoming).toBeCloseTo(Math.SQRT1_2, 10);
  });

  it("moves in one direction only", () => {
    let previous = equalPowerGains(0);
    for (let step = 1; step <= 20; step++) {
      const current = equalPowerGains(step / 20);
      expect(current.outgoing).toBeLessThanOrEqual(previous.outgoing);
      expect(current.incoming).toBeGreaterThanOrEqual(previous.incoming);
      previous = current;
    }
  });
});
