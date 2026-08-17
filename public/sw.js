/**
 * Service worker: an offline fallback, and a cache for immutable build assets.
 *
 * Deliberately small. It does two things and refuses to guess about anything
 * else:
 *
 * 1. **Navigations go to the network first.** If the network fails, the cached
 *    offline page is served instead. HTML is never answered from cache while
 *    online, so a deploy is picked up on the next load rather than whenever a
 *    cache happens to expire.
 * 2. **`/_next/static/*` is answered from cache first.** Those filenames
 *    contain a content hash, so a given URL's bytes can never change — the one
 *    case where cache-first needs no revalidation to be correct.
 *
 * Everything else — the API, uploaded media, audio, RSC payloads — is left
 * completely alone: the handler returns without calling `respondWith`, so the
 * browser performs its own normal request. That matters for more than caching
 * policy. Audio is fetched with `Range` headers, and a worker that intercepted
 * those would have to reimplement partial responses correctly to avoid breaking
 * seeking.
 *
 * Written as a plain file in `public/` rather than compiled from the app: it
 * has no imports, and keeping it out of the bundler means the version below is
 * the only thing that decides when caches are replaced.
 */

/**
 * Bump to retire every cache this worker owns.
 *
 * The asset cache is keyed by content-hashed URLs, so it does not strictly need
 * a version — but tying both caches to one string means "start clean" is a
 * one-token change rather than a decision per cache.
 */
const VERSION = "v1";

const SHELL_CACHE = `spotify-shell-${VERSION}`;
const ASSET_CACHE = `spotify-assets-${VERSION}`;
const OWNED_CACHES = [SHELL_CACHE, ASSET_CACHE];

/** Where a failed navigation lands. */
const OFFLINE_URL = "/offline";

/**
 * Precached at install so the fallback is guaranteed to exist by the time it is
 * needed. The icons are here because the offline page shows the logo, and a
 * broken image is a worse offline experience than none.
 */
const SHELL_URLS = [OFFLINE_URL, "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // `reload` so installing never picks the shell up from the HTTP cache,
      // which is how a worker ends up serving the previous deploy's offline
      // page indefinitely.
      await cache.addAll(
        SHELL_URLS.map((url) => new Request(url, { cache: "reload" })),
      );
      // Take over as soon as this worker is ready. Safe here because HTML is
      // always fetched from the network and assets are immutable, so a new
      // worker cannot pair a stale document with fresh chunks.
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          // Only caches this worker created. Anything else on the origin
          // belongs to someone else and is not ours to delete.
          .filter((name) => name.startsWith("spotify-") && !OWNED_CACHES.includes(name))
          .map((name) => caches.delete(name)),
      );
      // Control the pages that are already open, so the first load after an
      // update does not run uncontrolled.
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only ever GET. A POST is by definition not idempotent, and replaying one
  // from a worker is how a form gets submitted twice.
  if (request.method !== "GET") return;

  // Cross-origin: the object store, the API on another host, anything else.
  // Not ours to cache, and not ours to interfere with.
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // A partial request, which means media seeking. Handing back a full 200 for
  // a request that asked for bytes 5000-10000 breaks playback outright.
  if (request.headers.has("range")) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(handleImmutableAsset(request));
  }

  // Anything else falls through to the network untouched.
});

/**
 * Network first, offline page as the fallback.
 *
 * The response is not cached: a document names the exact hashed chunks it needs
 * and pairing a stale one with a new build is the classic way a cached SPA
 * white-screens after a deploy.
 */
async function handleNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    const offline = await cache.match(OFFLINE_URL);
    // `Response.error()` is not a valid reply to a navigation, so there is a
    // last-resort body for the case where even the precache is missing.
    return (
      offline ??
      new Response("آفلاین هستید.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }
}

/**
 * Cache first, because the URL contains a content hash.
 *
 * A hit is returned without touching the network, which is what makes a
 * repeat visit fast and an offline one possible at all.
 */
async function handleImmutableAsset(request) {
  const cache = await caches.open(ASSET_CACHE);

  const hit = await cache.match(request);
  if (hit) return hit;

  const response = await fetch(request);
  // Only complete, successful, same-origin responses are worth storing. An
  // opaque or partial response cached here would be indistinguishable from a
  // real one on the next hit.
  if (response.ok && response.type === "basic") {
    // Not awaited: the caller should not wait on a write it does not read.
    void cache.put(request, response.clone());
  }
  return response;
}
