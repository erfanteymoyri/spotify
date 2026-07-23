"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { LocaleSync } from "@/components/layout/locale-sync";
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
        <LocaleSync />
        <AudioPlayerInit />
        {children}
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
