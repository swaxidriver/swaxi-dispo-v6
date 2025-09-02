const CACHE_VERSION = "v2";
const APP_SHELL_CACHE = `swaxi-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `swaxi-runtime-${CACHE_VERSION}`;
const APP_SHELL = ["/", "/index.html", "/vite.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => ![APP_SHELL_CACHE, RUNTIME_CACHE].includes(k))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Strategy:
// 1. App shell: cache-first (precache above)
// 2. Same-origin non-HTML GET requests: stale-while-revalidate (serve cache, then update)
// 3. Navigation requests (mode 'navigate') fallback to index.html (SPA)
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Navigation (HTML) -> network first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/index.html")));
    return;
  }

  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((resp) => {
            if (resp.status === 200 && resp.type === "basic") {
              const clone = resp.clone();
              caches
                .open(RUNTIME_CACHE)
                .then((cache) => cache.put(request, clone));
            }
            return resp;
          })
          .catch(() => cached);
        // Return cached immediately if present, else network
        return cached || fetchPromise;
      }),
    );
  }
});
