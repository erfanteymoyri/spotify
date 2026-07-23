import { describe, expect, it } from "vitest";
import { DEFAULT_PRICING, calculateArtistReward } from "@/lib/rewards";

describe("calculateArtistReward", () => {
  it("combines listener and stream rates deterministically", () => {
    // 1000 * 1200 + 500 * 300 = 1_200_000 + 150_000
    expect(calculateArtistReward(1000, 500)).toBe(1_350_000);
  });

  it("returns zero for a brand-new artist with no activity", () => {
    expect(calculateArtistReward(0, 0)).toBe(0);
  });

  it("scales linearly with streams", () => {
    const base = calculateArtistReward(0, 100);
    expect(calculateArtistReward(0, 200)).toBe(base * 2);
  });
});

describe("DEFAULT_PRICING", () => {
  it("prices gold above silver", () => {
    expect(DEFAULT_PRICING.gold).toBeGreaterThan(DEFAULT_PRICING.silver);
  });
});
