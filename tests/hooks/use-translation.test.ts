import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useTranslation } from "@/hooks/use-translation";
import { useLocaleStore } from "@/stores/locale-store";

describe("useTranslation", () => {
  beforeEach(() => {
    act(() => useLocaleStore.getState().setLocale("fa"));
  });

  it("translates a key in the active locale", () => {
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t("common.login")).toBe("ورود");
  });

  it("follows a locale change", () => {
    const { result } = renderHook(() => useTranslation());

    act(() => useLocaleStore.getState().setLocale("en"));

    expect(result.current.t("common.login")).toBe("Log in");
  });

  /**
   * Regression: `t` used to be redeclared on every render, so any effect with
   * `t` in its dependency array re-ran on every render. Combined with an effect
   * that sets state — the payment-return handler on the settings page — that
   * looped forever, firing an endless stream of toasts.
   */
  it("keeps a stable identity across re-renders", () => {
    const { result, rerender } = renderHook(() => useTranslation());
    const first = result.current.t;

    rerender();
    rerender();

    expect(result.current.t).toBe(first);
  });

  it("changes identity only when the locale changes", () => {
    const { result } = renderHook(() => useTranslation());
    const before = result.current.t;

    act(() => useLocaleStore.getState().setLocale("en"));

    expect(result.current.t).not.toBe(before);
  });

  it("falls back to the key when it is missing", () => {
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t("nope.not.here")).toBe("nope.not.here");
  });
});
