"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { RotateCcw, WifiOff } from "lucide-react";
import { FadeIn } from "@/components/shared/motion";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/ui/button";

/**
 * Where the service worker sends a navigation it could not fetch.
 *
 * Outside the `(main)` route group on purpose: that group is wrapped in
 * `AuthGuard`, which needs the API to confirm a session — exactly what is
 * unavailable here. This page depends on nothing but the bundle it was served
 * with, so it renders whether or not anyone is signed in.
 *
 * It is precached by the worker at install time, so it exists before it is ever
 * needed rather than being fetched at the moment the network is known to be
 * down.
 */
export default function OfflinePage() {
  const { t } = useTranslation();
  const [isBackOnline, setIsBackOnline] = useState(false);

  /**
   * Watch for the connection returning.
   *
   * `online` is not by itself proof that the app is reachable — a captive
   * portal fires it too — so it enables a retry rather than navigating on its
   * own. Reloading automatically would loop against a portal.
   */
  useEffect(() => {
    const update = () => setIsBackOnline(navigator.onLine);
    update();

    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <FadeIn className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={64}
          height={64}
          className="rounded-2xl"
          // Precached alongside this page, and small enough that routing it
          // through the optimizer would only add a request that must succeed.
          unoptimized
          priority
        />

        <div className="flex size-16 items-center justify-center rounded-full border border-border bg-muted">
          <WifiOff className="size-7 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold">{t("offline.title")}</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {isBackOnline ? t("offline.restored") : t("offline.description")}
          </p>
        </div>

        <Button className="w-full" onClick={() => window.location.reload()}>
          <RotateCcw />
          {t("offline.retry")}
        </Button>
      </FadeIn>
    </main>
  );
}
