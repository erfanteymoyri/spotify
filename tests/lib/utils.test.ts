import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges conflicting tailwind classes with the last winning", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("drops falsy values and keeps conditional classes", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("resolves object and array syntax", () => {
    expect(cn(["a", { b: true, c: false }])).toBe("a b");
  });
});
