// @ts-nocheck
/* eslint-disable */

const CACHE_NAME = "heroic-v1";
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

// Install: pre-cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
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

  // Google Fonts: cache-first (they're immutable)
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Content JSON/HTML: network-first, fall back to cache
  if (url.pathname.startsWith("/content/")) {
    event.respondWith(networkFirst(event.request));
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
        caches.match("/index.html").then((cached) => cached || fetch(event.request))
      );
      return;
    }
    event.respondWith(cacheFirst(event.request));
    return;
  }
});

/**
 * Cache-first: return cached response or fetch, cache, and return.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
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

/**
 * Network-first: try network, cache successful responses, fall back to cache.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}
