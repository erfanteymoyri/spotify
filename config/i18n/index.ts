import { messages as en } from "./messages/en";
import type { Messages } from "./messages/en";
import { messages as fa } from "./messages/fa";
import type { Locale } from "./types";

const catalogs: Record<Locale, Messages> = { en, fa };

function getNestedValue(obj: Messages, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof current === "string" ? current : path;
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  let text = getNestedValue(catalogs[locale], key);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

export { en, fa };
