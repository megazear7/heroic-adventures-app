/**
 * Test suite for the Heroic Adventures app.
 * Verifies static build output, content serving, and SPA route responses.
 *
 * Usage:  npm test              (requires built app + content)
 * Or:     npx tsx scripts/test.ts
 */

import { promises as fs } from "fs";
import path from "path";

const APP_PORT = process.env.APP_PORT ?? "3000";
const BASE = `http://localhost:${APP_PORT}`;

let passed = 0;
let failed = 0;

async function assert(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}: ${err}`);
    failed++;
  }
}

async function assertStatus(url: string, expected: number): Promise<Response> {
  const res = await fetch(url);
  if (res.status !== expected) {
    throw new Error(`Expected ${expected}, got ${res.status} for ${url}`);
  }
  return res;
}

/* ---------- Content file tests (no server needed) ---------- */

async function testContentFiles(): Promise<void> {
  console.log("\n📂 Content file tests:");

  await assert("categories.json exists", async () => {
    const data = await fs.readFile("dist/content/categories.json", "utf-8");
    const categories = JSON.parse(data);
    if (!Array.isArray(categories) || categories.length === 0) {
      throw new Error("categories.json should be a non-empty array");
    }
  });

  await assert("search-index.json exists with searchable entries", async () => {
    const data = await fs.readFile("dist/content/search-index.json", "utf-8");
    const index = JSON.parse(data);
    if (!Array.isArray(index) || index.length === 0) {
      throw new Error("search-index.json should be a non-empty array");
    }
    const sample = index[0];
    for (const key of ["id", "title", "slug", "categoryId", "categoryName", "order"]) {
      if (!(key in sample)) {
        throw new Error(`search index entry missing required key: ${key}`);
      }
    }
  });

  await assert("each category dir has list.json", async () => {
    const data = await fs.readFile("dist/content/categories.json", "utf-8");
    const categories = JSON.parse(data);
    for (const cat of categories) {
      if ((cat.count ?? 0) === 0) {
        continue;
      }
      const listPath = path.join("dist/content", cat.id, "list.json");
      await fs.access(listPath);
    }
  });

  await assert("category entries have entry.json and content.html", async () => {
    const data = await fs.readFile("dist/content/categories.json", "utf-8");
    const categories = JSON.parse(data);
    let checked = 0;
    for (const cat of categories) {
      if ((cat.count ?? 0) === 0) {
        continue;
      }
      const listPath = path.join("dist/content", cat.id, "list.json");
      const listData = JSON.parse(await fs.readFile(listPath, "utf-8"));
      for (const item of listData.slice(0, 2)) {
        // check first 2 per category
        const entryPath = path.join("dist/content", cat.id, item.slug, "entry.json");
        const htmlPath = path.join("dist/content", cat.id, item.slug, "content.html");
        await fs.access(entryPath);
        await fs.access(htmlPath);
        checked++;
      }
    }
    if (checked === 0) {
      console.log("  ℹ No published entries found yet; entry file spot-check skipped");
    }
  });
}

/* ---------- Static server endpoint tests ---------- */

async function testServerEndpoints(): Promise<void> {
  console.log("\n🌐 Static endpoint tests:");

  await assert("GET / returns 200 with HTML", async () => {
    const res = await assertStatus(BASE, 200);
    const text = await res.text();
    if (!text.includes("heroic-app")) throw new Error("Missing app element in HTML");
  });

  await assert("GET /content/categories.json returns data", async () => {
    const res = await assertStatus(`${BASE}/content/categories.json`, 200);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Expected array");
  });

  await assert("GET /content/<category>/list.json returns data", async () => {
    const catRes = await fetch(`${BASE}/content/categories.json`);
    const categories = await catRes.json();
    if (categories.length > 0) {
      const cat = categories[0];
      const res = await assertStatus(`${BASE}/content/${cat.id}/list.json`, 200);
      const list = await res.json();
      if (!Array.isArray(list)) throw new Error("Expected array");
    }
  });

  await assert("SPA routes return HTML shell", async () => {
    for (const route of ["/chapters", "/search", "/classes/warrior"]) {
      const res = await assertStatus(`${BASE}${route}`, 200);
      const text = await res.text();
      if (!text.includes("heroic-app")) throw new Error(`Route ${route} missing app shell`);
    }
  });
}

/* ---------- Build output tests ---------- */

async function testBuildOutput(): Promise<void> {
  console.log("\n📦 Build output tests:");

  await assert("bundle.js exists", async () => {
    await fs.access("dist/bundle.js");
  });

  await assert("index.html exists", async () => {
    await fs.access("dist/index.html");
  });

  await assert("app.css is in static", async () => {
    await fs.access("src/static/app.css");
  });
}

/* ---------- PWA static config tests ---------- */

async function testPwaStaticConfig(): Promise<void> {
  console.log("\n📱 PWA static config tests:");

  await assert("manifest includes app shortcuts", async () => {
    const manifestRaw = await fs.readFile("src/static/manifest.json", "utf-8");
    const manifest = JSON.parse(manifestRaw);
    const shortcuts = Array.isArray(manifest.shortcuts) ? manifest.shortcuts : [];
    const urls = shortcuts
      .map((shortcut: { url?: string }) => shortcut.url)
      .filter((url: string | undefined): url is string => Boolean(url));
    for (const expected of ["/characters", "/adventure-log", "/search", "/spells-arcane"]) {
      if (!urls.includes(expected)) {
        throw new Error(`Missing shortcut for ${expected}`);
      }
    }
  });

  await assert("service worker has offline navigation fallback", async () => {
    const sw = await fs.readFile("src/static/sw.js", "utf-8");
    if (!sw.includes("navigationRequest(event.request)")) {
      throw new Error("Expected navigationRequest handler in fetch event");
    }
    if (!sw.includes('caches.match("/index.html",')) {
      throw new Error("Expected /index.html fallback for offline navigation");
    }
  });
}

/* ---------- Main ---------- */

async function main(): Promise<void> {
  console.log("🧪 Heroic Adventures App — Test Suite\n");

  const args = process.argv.slice(2);
  const serverMode = args.includes("--server");

  await testBuildOutput();
  await testPwaStaticConfig();
  await testContentFiles();

  if (serverMode) {
    await testServerEndpoints();
  } else {
    console.log("\n⏭  Endpoint tests skipped (run with --server while static server is running)");
  }

  console.log(`\n${"—".repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
