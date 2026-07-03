import { ApiError } from "@/api/client";

export function parseApiError(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;

  const data = error.data;
  if (!data || typeof data !== "object") return fallback;

  const record = data as Record<string, unknown>;
  if (typeof record.detail === "string") return record.detail;

  const messages: string[] = [];
  for (const value of Object.values(record)) {
    if (typeof value === "string") messages.push(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") messages.push(item);
      }
    }
  }

  return messages[0] ?? fallback;
}
