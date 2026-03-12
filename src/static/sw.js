// @ts-nocheck
/* eslint-disable */

const CACHE_NAME = "heroic-v4";
const APP_SHELL = [
  "/",
  "/index.html",
  "/bundle.js",
  "/app.css",
  "/manifest.json",
  "/logo/logo-512x512.png",
  "/logo/logo-256x256.png",
  "/logo/logo-128x128.png",
  "/logo/favicon.ico",
];

/**
 * Pre-cache an array of URL paths in small batches.
 * Each URL is cached individually so one failure doesn't block the rest.
 * For .html paths, we also store the response under the extensionless URL
 * (the app fetches /content/.../content, NOT /content/.../content.html).
 */
async function precacheUrls(cache, urls, batchSize) {
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(new Request(url), response.clone());
            // Also cache under the extensionless path so the app can find it
            if (url.endsWith(".html")) {
              const extensionless = url.replace(/\.html$/, "");
              await cache.put(new Request(extensionless), response.clone());
            }
          }
        } catch {
          // Skip this URL — don't block the rest
        }
      })
    );
  }
}

// Install: pre-cache the app shell + all content files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(APP_SHELL);
      // Fetch the content index and cache every content path in batches
      try {
        const res = await fetch("/content/index.json");
        if (res.ok) {
          const contentPaths = await res.json();
          await precacheUrls(cache, contentPaths, 50);
        }
      } catch {
        console.warn("SW: could not pre-cache content index");
      }
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: routing strategy per request type
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle GET requests
  if (event.request.method !== "GET") return;

  // Google Fonts: cache-first
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Content JSON/HTML: cache-first
  if (url.pathname.startsWith("/content/")) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Contentful CDN images: cache-first
  if (
    url.hostname.includes("ctfassets.net") ||
    url.hostname.includes("contentful.com")
  ) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // App shell & same-origin assets: cache-first
  if (url.origin === self.location.origin) {
    // For navigation requests, serve the cached index.html (SPA)
    if (event.request.mode === "navigate") {
      event.respondWith(
        caches
          .match("/index.html", { ignoreVary: true })
          .then((cached) => cached || fetch(event.request))
      );
      return;
    }
    event.respondWith(cacheFirst(event.request));
    return;
  }
});

/**
 * Cache-first with ignoreVary to avoid Vary header mismatch issues.
 * Falls back to network, caching successful responses for future use.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreVary: true });
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}
