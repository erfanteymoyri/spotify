"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { LocaleSync } from "@/components/layout/locale-sync";
import { PlansProvider } from "@/providers/plans-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/ui/sonner";

function AudioPlayerInit() {
  useAudioPlayer();
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {/* Subscription plans are fetched once and shared: they gate features
            on nearly every screen but change only when an admin edits them. */}
        <PlansProvider>
          <LocaleSync />
          <AudioPlayerInit />
          {children}
          <Toaster />
        </PlansProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
