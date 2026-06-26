"use client";

import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { MusicPlayer } from "@/components/player/music-player";
import { MobileNav } from "./mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-4 pb-28 md:px-6 md:pb-24">
          {children}
        </main>
        <MusicPlayer />
        <MobileNav />
      </div>
    </div>
  );
}
