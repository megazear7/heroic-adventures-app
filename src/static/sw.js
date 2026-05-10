// @ts-nocheck
/* eslint-disable */

const CACHE_NAME = "heroic-v5";
const APP_SHELL = [
  "/",
  "/index.html",
  "/bundle.js",
  "/app.css",
  "/manifest.json",
  "/logo/logo-512x512.png",
  "/logo/logo-256x256.png",
  "/logo/logo-128x128.png",
  "/logo/logo-64x64.png",
  "/logo/logo-32x32.png",
  "/logo/logo-24x24.png",
  "/logo/logo-16x16.png",
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
      }),
    );
  }
}

// Install: pre-cache the app shell + all content files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await precacheUrls(cache, APP_SHELL, APP_SHELL.length);
      // Fetch the content index and cache every content path in batches
      try {
        const res = await fetch("/content/index.json");
        if (res.ok) {
          const indexClone = res.clone();
          const contentPaths = await res.json();
          await cache.put(new Request("/content/index.json"), indexClone);
          await precacheUrls(cache, contentPaths, 50);
        }
      } catch {
        console.warn("SW: could not pre-cache content index");
      }
    }),
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

// Fetch: routing strategy per request type
// Note: character sheets (/characters) and adventure logs (/adventure-log) are
// stored in localStorage and are therefore fully available offline. The service
// worker ensures the app shell is always cached so these pages can load without
// a network connection.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle GET requests
  if (event.request.method !== "GET") return;

  // Google Fonts: cache-first
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
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
    url.hostname === "ctfassets.net" ||
    url.hostname.endsWith(".ctfassets.net") ||
    url.hostname === "contentful.com" ||
    url.hostname.endsWith(".contentful.com")
  ) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // App shell & same-origin assets
  if (url.origin === self.location.origin) {
    // For navigation requests, use network-first with cached shell fallback.
    // This keeps deep links working offline and refreshes shell when online.
    if (event.request.mode === "navigate") {
      event.respondWith(navigationRequest(event.request));
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

async function navigationRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put("/index.html", response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match("/index.html", { ignoreVary: true });
    if (cached) return cached;
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}
