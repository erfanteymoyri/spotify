"use client";

import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/ui/button";
import { cn } from "@/lib/utils";

/**
 * `beforeinstallprompt` is not in the DOM lib — it is a Chromium extension to
 * the spec rather than a standard event, which is the same reason this component
 * is purely additive.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Installs the app, on the browsers that let a page ask.
 *
 * Renders **nothing at all** unless the browser has offered us the prompt, so
 * this adds an affordance where one exists and stays invisible everywhere else:
 * Safari and Firefox never fire `beforeinstallprompt` and reach installation
 * through their own menus, and Chromium also withholds the event once the app is
 * already installed. That makes "did the event arrive" a better test of
 * installability than anything this component could work out for itself —
 * sniffing the platform or reading `display-mode` would only produce a button
 * that lies on some of them.
 *
 * The event is captured because the browser fires it once, early — usually
 * before the listener has any reason to want it — and `prompt()` may only be
 * called from a gesture. Holding the event is what turns "the browser offered
 * once" into "the button works whenever it is pressed".
 */
export function InstallButton({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const capture = (event: Event) => {
      // Suppress the browser's own mini-infobar so there is one install
      // affordance rather than two competing ones.
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    // Once installed the button has nothing left to do, and the stashed event
    // is spent.
    const clear = () => setInstallPrompt(null);

    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", clear);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", clear);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installPrompt) return;
    // Cleared either way: the event cannot be prompted with twice, and leaving
    // the button up would give a second press no effect. A listener who
    // dismissed it gets the browser's own affordance on a later visit rather
    // than being asked again now.
    setInstallPrompt(null);
    try {
      await installPrompt.prompt();
    } catch {
      // Already used, or refused because the gesture was not trusted. Nothing
      // to recover: the browser's menu remains the way in.
    }
  }, [installPrompt]);

  if (!installPrompt) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => void install()}
      className={cn("gap-1.5", className)}
    >
      <Download className="size-4" />
      <span className="hidden sm:inline">{t("pwa.install")}</span>
    </Button>
  );
}
