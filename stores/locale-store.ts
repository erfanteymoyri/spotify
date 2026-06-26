import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "@/config/i18n/types";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "fa",
      setLocale: (locale) => set({ locale }),
    }),
    { name: "spotify-locale" },
  ),
);
