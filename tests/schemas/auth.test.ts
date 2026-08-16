import { describe, expect, it } from "vitest";
import { resetCodeSchema, resetPasswordSchema } from "@/schemas/auth";

describe("resetCodeSchema", () => {
  it("accepts a six-digit code", () => {
    expect(resetCodeSchema.safeParse({ code: "042318" }).success).toBe(true);
  });

  it("rejects codes of the wrong length", () => {
    expect(resetCodeSchema.safeParse({ code: "1234" }).success).toBe(false);
    expect(resetCodeSchema.safeParse({ code: "1234567" }).success).toBe(false);
  });

  it("rejects anything that is not digits", () => {
    // Guards against the server burning an attempt on an obvious typo, and
    // against a pasted code that came with surrounding whitespace.
    expect(resetCodeSchema.safeParse({ code: "12 34" }).success).toBe(false);
    expect(resetCodeSchema.safeParse({ code: "abcdef" }).success).toBe(false);
    expect(resetCodeSchema.safeParse({ code: " 123456" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts a long-enough password entered twice", () => {
    const result = resetPasswordSchema.safeParse({
      password: "a-new-password",
      confirmPassword: "a-new-password",
    });
    expect(result.success).toBe(true);
  });

  it("enforces the same six-character floor as the backend", () => {
    const result = resetPasswordSchema.safeParse({
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("reports a mismatch against the confirmation field", () => {
    const result = resetPasswordSchema.safeParse({
      password: "a-new-password",
      confirmPassword: "a-different-one",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });
});
