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
