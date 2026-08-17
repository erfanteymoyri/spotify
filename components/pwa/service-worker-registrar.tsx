"use client";

import { useEffect } from "react";

/**
 * Registers the service worker, and unregisters it where it would do harm.
 *
 * Renders nothing — it is mounted once from `AppProviders` purely for its
 * effect. A component rather than a bare script so it runs after hydration,
 * when the page is interactive and the registration is competing with nothing
 * the listener is waiting for.
 *
 * **Production only, and the dev branch is not symmetrical.** In development the
 * worker is actively removed rather than merely not installed: Turbopack serves
 * chunks under the same `/_next/static/` paths the worker treats as immutable,
 * so a registration left behind from a production build would pin a developer
 * to stale chunks and present as edits that do not appear. Unregistering makes
 * switching between `next build` and `next dev` on one origin safe.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((r) => r.unregister())),
        )
        .catch(() => {});
      return;
    }

    void navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
        // Fetch the worker itself past the HTTP cache. Without this a browser
        // may answer the update check from its own cache and a deploy can go
        // unnoticed for as long as that entry lives.
        updateViaCache: "none",
      })
      // Registration fails on an insecure origin, in a private window on some
      // browsers, or when the user has blocked storage. None of that is
      // actionable and none of it should affect the app: without a worker the
      // site simply behaves like an ordinary one.
      .catch(() => {});
  }, []);

  return null;
}
