import { describe, expect, it } from "vitest";
import { translate } from "@/config/i18n";

describe("translate", () => {
  it("resolves nested keys for both locales", () => {
    expect(translate("en", "common.save")).toBe("Save");
    expect(translate("fa", "common.save")).toBe("ذخیره");
  });

  it("interpolates named params", () => {
    const out = translate("en", "playlists.count", { current: 3, max: 6 });
    expect(out).toBe("3 of 6 playlists");
  });

  it("interpolates a param named more than once in the sentence", () => {
    // The plan-switch warning names the plan twice; substituting only the
    // first left a literal "{currentPlan}" in the middle of the toast.
    const out = translate("en", "subscription.switchWarningMessage", {
      currentPlan: "Gold",
      days: 42,
    });

    expect(out).not.toContain("{");
    expect(out.match(/Gold/g)).toHaveLength(2);
  });

  it("returns the key itself for a missing path (safe fallback)", () => {
    expect(translate("en", "does.not.exist")).toBe("does.not.exist");
  });

  it("does not treat an intermediate object node as a translation", () => {
    // "common" is an object, not a leaf string
    expect(translate("en", "common")).toBe("common");
  });

  it("leaves unmatched placeholders untouched", () => {
    const out = translate("en", "player.playTrack", {});
    expect(out).toContain("{title}");
  });
});
