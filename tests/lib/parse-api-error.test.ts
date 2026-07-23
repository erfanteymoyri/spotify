import { describe, expect, it } from "vitest";
import { ApiError } from "@/api/client";
import { parseApiError } from "@/lib/parse-api-error";

const FALLBACK = "Something went wrong";

describe("parseApiError", () => {
  it("falls back for non-ApiError values", () => {
    expect(parseApiError(new Error("boom"), FALLBACK)).toBe(FALLBACK);
    expect(parseApiError("nope", FALLBACK)).toBe(FALLBACK);
  });

  it("prefers a top-level detail string (DRF style)", () => {
    const err = new ApiError(400, "Bad Request", { detail: "Invalid token" });
    expect(parseApiError(err, FALLBACK)).toBe("Invalid token");
  });

  it("extracts the first field error string", () => {
    const err = new ApiError(400, "Bad Request", { email: "already taken" });
    expect(parseApiError(err, FALLBACK)).toBe("already taken");
  });

  it("extracts the first item from a field error array", () => {
    const err = new ApiError(400, "Bad Request", {
      password: ["too short", "too common"],
    });
    expect(parseApiError(err, FALLBACK)).toBe("too short");
  });

  it("falls back when the payload has no usable message", () => {
    const err = new ApiError(500, "Server Error", { code: 42 });
    expect(parseApiError(err, FALLBACK)).toBe(FALLBACK);
  });
});
