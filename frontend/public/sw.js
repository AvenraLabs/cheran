const CACHE_NAME = "cheran-pwa-v4";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/favicon.ico",
  "/favicon.png",
  "/icon.png",
  "/manifest.json",
  "/icons/icon.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
];

// Helper: fetch with strict timeout to prevent pending/hanging requests
function fetchWithTimeout(request, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Service Worker Fetch Timeout"));
    }, timeoutMs);

    fetch(request)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event - purge all older caches immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Completely bypass non-GET, API requests, WebSocket, and external origins
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api") ||
    url.pathname.includes("/api/") ||
    url.pathname.startsWith("/socket.io") ||
    url.port === "5000"
  ) {
    return;
  }

  // 2. SPA Navigation requests: always serve index.html shell immediately
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match("/index.html").then((cachedIndex) => {
        if (cachedIndex) {
          return cachedIndex;
        }
        return fetchWithTimeout("/index.html", 3000).catch(() => caches.match("/"));
      })
    );
    return;
  }

  // 3. Static Assets: Cache-first with timeout-guarded background refresh
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Refresh in background if connected (non-blocking)
        fetchWithTimeout(request, 3000)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetchWithTimeout(request, 6000)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
        });
    })
  );
});
