const CACHE = "barber-ledger-v1";

// On install: cache the app shell immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add("/"))
  );
  self.skipWaiting();
});

// On activate: drop old caches, take control of all open tabs immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle requests from this origin
  if (url.origin !== location.origin) return;

  if (request.mode === "navigate") {
    // Navigation (opening the app): try network first with a 4s timeout,
    // fall back to the cached shell so the app still opens when offline.
    event.respondWith(
      Promise.race([
        fetch(request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
          return res;
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000)),
      ]).catch(() =>
        caches.match(request).then((cached) => cached || caches.match("/"))
      )
    );
  } else {
    // Static assets (JS, CSS, images, fonts): cache-first.
    // Vite fingerprints asset filenames with a content hash so stale cache is never
    // an issue — a changed file gets a new URL and is fetched fresh automatically.
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          // Only cache successful same-origin responses
          if (!res || res.status !== 200 || res.type !== "basic") return res;
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
          return res;
        });
      })
    );
  }
});
