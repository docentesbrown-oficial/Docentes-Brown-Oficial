/* Docentes Brown · Súper App Maestra
 * Simple offline cache (Cache First for static, Network First for navigation)
 * IMPORTANT: Works best when served over HTTPS (GitHub Pages OK).
 */
const CACHE_NAME = "db-superapp-v1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/favicon-32.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))
      )
    )
  );
  self.clients.claim();
});

// Navigation requests: network-first (fallback to cache)
async function handleNavigation(request) {
  try {
    const fresh = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put("./", fresh.clone());
    return fresh;
  } catch (e) {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match("./")) || (await cache.match("./index.html"));
  }
}

// Static: cache-first
async function handleStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, fresh.clone());
  return fresh;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Navigations
  if (req.mode === "navigate") {
    event.respondWith(handleNavigation(req));
    return;
  }

  // Static assets
  event.respondWith(handleStatic(req));
});
