/** Convert seconds to mm:ss format */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/** Format number with locale-aware grouping */
export function formatNumber(num: number, locale = "fa-IR"): string {
  return num.toLocaleString(locale);
}
