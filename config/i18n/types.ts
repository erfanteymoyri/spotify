export type Locale = "fa" | "en";

export const locales: Locale[] = ["fa", "en"];

export const localeConfig: Record<
  Locale,
  { label: string; dir: "rtl" | "ltr" }
> = {
  fa: { label: "فارسی", dir: "rtl" },
  en: { label: "English", dir: "ltr" },
};

export type TranslationKey = keyof typeof import("./messages/en").messages;
