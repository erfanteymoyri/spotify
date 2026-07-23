import { describe, expect, it } from "vitest";
import {
  formatCompactNumber,
  formatDate,
  formatDuration,
  formatNumber,
} from "@/lib/format";

describe("formatDuration", () => {
  it("formats whole minutes and zero-pads seconds", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(5)).toBe("0:05");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(600)).toBe("10:00");
  });

  it("floors fractional seconds", () => {
    expect(formatDuration(90.9)).toBe("1:30");
  });
});

describe("formatNumber", () => {
  it("groups digits using the requested locale", () => {
    expect(formatNumber(1234567, "en-US")).toBe("1,234,567");
  });

  it("defaults to Persian grouping", () => {
    // fa-IR uses Persian digits; assert it differs from the plain string
    expect(formatNumber(1000)).not.toBe("1000");
  });
});

describe("formatCompactNumber", () => {
  it("shortens large numbers with compact notation", () => {
    const result = formatCompactNumber(1_500_000, "en-US");
    expect(result).toBe("1.5M");
  });

  it("keeps small numbers readable", () => {
    expect(formatCompactNumber(950, "en-US")).toBe("950");
  });
});

describe("formatDate", () => {
  it("produces a localized short date without throwing", () => {
    const out = formatDate("2025-05-10T00:00:00Z", "en-US");
    expect(out).toContain("2025");
  });
});
