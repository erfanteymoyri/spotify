"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { LocaleSync } from "@/components/layout/locale-sync";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import { DynamicThemeProvider } from "@/providers/dynamic-theme-provider";
import { PlansProvider } from "@/providers/plans-provider";
import { PreferencesProvider } from "@/providers/preferences-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/ui/sonner";

function AudioPlayerInit() {
  useAudioPlayer();
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {/* Outside every data provider: it registers the worker and depends on
          nothing, so it must not be gated behind a session or a fetch. */}
      <ServiceWorkerRegistrar />
      <AuthProvider>
        {/* Subscription plans are fetched once and shared: they gate features
            on nearly every screen but change only when an admin edits them. */}
        <PlansProvider>
          {/* Server-side preferences first: the theme reads the stored colour
              from it, and the player reads crossfade and quality. */}
          <PreferencesProvider>
            <DynamicThemeProvider>
              <LocaleSync />
              <AudioPlayerInit />
              {children}
              <Toaster />
            </DynamicThemeProvider>
          </PreferencesProvider>
        </PlansProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
