"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { settingsService } from "@/services/user.service";
import { useAuthStore } from "@/stores/auth-store";
import { usePlayerStore } from "@/stores/player-store";
import type { UserSettings } from "@/types";

/**
 * The one owner of server-side preferences.
 *
 * Crossfade, streaming quality and the theme colour are read in three places
 * (the player bar, the settings page, the theme) and written from two, so
 * without a single owner they would each fetch and each PATCH, and the player
 * would show a toggle the settings page had already changed. Here the state is
 * fetched once, pushed into the player store, and updated optimistically.
 *
 * Signed-out visitors get the defaults and keep their changes for the session
 * only. That is deliberate: the spec puts preferences on the server so they
 * follow the account, and there is no account to follow yet.
 */

export const DEFAULT_SETTINGS: UserSettings = {
  notificationsEnabled: true,
  volume: 0.75,
  language: "fa",
  crossfadeEnabled: false,
  crossfadeSeconds: 5,
  preferredQuality: "auto",
  backgroundColor: "",
};

interface PreferencesValue {
  settings: UserSettings;
  /** Optimistic: the UI moves at once and rolls back if the server refuses. */
  update: (patch: Partial<UserSettings>) => Promise<void>;
  isLoading: boolean;
}

const PreferencesContext = createContext<PreferencesValue>({
  settings: DEFAULT_SETTINGS,
  update: async () => {},
  isLoading: true,
});

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isFetched, setIsFetched] = useState(false);

  // Signing in or out invalidates whatever is held. Adjusted during render
  // rather than in an effect: an effect would let one frame paint the previous
  // account's colour before resetting it.
  const [authSnapshot, setAuthSnapshot] = useState(isAuthenticated);
  if (authSnapshot !== isAuthenticated) {
    setAuthSnapshot(isAuthenticated);
    setSettings(DEFAULT_SETTINGS);
    setIsFetched(false);
  }

  // Nothing to load for a signed-out visitor, so they are never "loading".
  const isLoading = isAuthenticated && !isFetched;

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    settingsService
      .getSettings()
      .then((loaded) => {
        if (cancelled) return;
        setSettings(loaded);
        // This effect runs once per sign-in, so this is the first read of the
        // account's preferences -- the right moment, and the only one, to seed
        // the player's volume. Doing it on every save instead would yank the
        // slider back whenever an unrelated preference changed.
        usePlayerStore.getState().setVolume(loaded.volume);
      })
      // Preferences are a nicety; failing to read them must not stop the app,
      // and the defaults are a working player.
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsFetched(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Push playback preferences down into the store the engine listens to.
  useEffect(() => {
    const player = usePlayerStore.getState();
    player.setCrossfade(settings.crossfadeEnabled, settings.crossfadeSeconds);
    player.setQualityPreference(settings.preferredQuality);
  }, [settings.crossfadeEnabled, settings.crossfadeSeconds, settings.preferredQuality]);

  const update = useCallback(
    async (patch: Partial<UserSettings>) => {
      // Captured from the updater rather than from the render closure, so this
      // callback does not need `settings` in its dependencies — with it, every
      // saved preference produced a new `update`, hence a new context value,
      // hence a re-render of every consumer under this provider.
      let previous = DEFAULT_SETTINGS;
      setSettings((current) => {
        previous = current;
        return { ...current, ...patch };
      });

      if (!isAuthenticated) return;

      try {
        const saved = await settingsService.updateSettings(patch);
        setSettings(saved);
      } catch (error) {
        // The server is the authority: an out-of-range value or an expired
        // session must not leave the UI showing a state that was not stored.
        setSettings(previous);
        throw error;
      }
    },
    [isAuthenticated],
  );

  const value = useMemo(
    () => ({ settings, update, isLoading }),
    [settings, update, isLoading],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesValue {
  return useContext(PreferencesContext);
}
