/**
 * Fetches all ruleReference entries from Contentful and builds
 * local JSON + HTML files used by the app at runtime.
 *
 * Usage:  npx tsx scripts/fetch-content.ts
 * Env:    CONTENTFUL_DELIVERY_TOKEN, CONTENTFUL_SPACE_ID (or defaults)
 */

import "dotenv/config";
import { createClient } from "contentful";
import { documentToHtmlString } from "@contentful/rich-text-html-renderer";
import { BLOCKS, INLINES, Document } from "@contentful/rich-text-types";
import { promises as fs } from "fs";
import path from "path";
import z from "zod";

/* ---------- configuration ---------- */

const SPACE_ID = z.string().parse(process.env.CONTENTFUL_SPACE_ID);
const ENV_ID = z.string().parse(process.env.CONTENTFUL_ENVIRONMENT_ID ?? "master");
const TOKEN = z.string().parse(process.env.CONTENTFUL_DELIVERY_TOKEN);

const CONTENT_DIR = path.resolve("dist/content");

/* ---------- category → directory slug mapping ---------- */

const CATEGORY_DIR_MAP: Record<string, string> = {
  background: "backgrounds",
  chapter: "chapters",
  class: "classes",
  expertise: "expertise",
  feat: "feats",
  flaw: "flaws",
  race: "races",
  rule: "rules",
  "agent > skill": "agent-skills",
  "agent > instruction": "agent-instructions",
  "spell > arcane": "spells-arcane",
  "spell > rune": "spells-rune",
  "spell > nature": "spells-nature",
  "spell > divine": "spells-divine",
  "item > potion": "items-potion",
  "item > scroll": "items-scroll",
  "item > weapon": "items-weapon",
  "item > armor": "items-armor",
  "item > shield": "items-shield",
};

/* pretty display name for each category */
const CATEGORY_DISPLAY: Record<string, string> = {
  background: "Backgrounds",
  chapter: "Chapters",
  class: "Classes",
  expertise: "Expertise",
  feat: "Feats",
  flaw: "Flaws",
  race: "Races",
  rule: "Rules",
  "agent > skill": "Agent Skills",
  "agent > instruction": "Agents",
  "spell > arcane": "Arcane Spells",
  "spell > rune": "Rune Spells",
  "spell > nature": "Nature Spells",
  "spell > divine": "Divine Spells",
  "item > potion": "Potions",
  "item > scroll": "Scrolls",
  "item > weapon": "Weapons",
  "item > armor": "Armor",
  "item > shield": "Shields",
};

/* ---------- helpers ---------- */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface AssetMap {
  [id: string]: { url: string; title: string; description: string };
}

function localizedField<T>(value: T | Record<string, T> | undefined): T | undefined {
  if (value == null) {
    return undefined;
  }

  if (
    typeof value === "object" &&
    !Array.isArray(value) &&
    "en-US" in (value as Record<string, unknown>)
  ) {
    return (value as Record<string, T>)["en-US"];
  }

  return value as T;
}

function buildRichTextOptions(assets: AssetMap) {
  return {
    renderNode: {
      [BLOCKS.EMBEDDED_ASSET]: (node: any) => {
        const assetId = node.data?.target?.sys?.id;
        const asset = assetId ? assets[assetId] : null;
        if (asset) {
          return `<img src="${asset.url}" alt="${asset.title || ""}" class="content-image" loading="lazy" />`;
        }
        return "";
      },
      [INLINES.ENTRY_HYPERLINK]: (node: any, next: any) => {
        const entryId = node.data?.target?.sys?.id;
        return `<a href="#" data-entry-id="${entryId}">${next(node.content)}</a>`;
      },
      [BLOCKS.EMBEDDED_ENTRY]: () => "",
      [INLINES.EMBEDDED_ENTRY]: () => "",
    },
  };
}

/* ---------- main ---------- */

async function main() {
  console.log("🔌 Connecting to Contentful…");
  const client = createClient({
    accessToken: TOKEN,
    space: SPACE_ID,
    environment: ENV_ID,
  });

  /* Fetch ALL ruleReference entries (paginated) */
  console.log("📥 Fetching entries…");
  const PAGE = 100;
  let skip = 0;
  let total = Infinity;
  const allEntries: any[] = [];

  while (skip < total) {
    const page = await client.getEntries({
      content_type: "ruleReference",
      limit: PAGE,
      skip,
      include: 2,
    });
    total = page.total;
    allEntries.push(...page.items);
    skip += PAGE;
  }
  console.log(`  ✓ ${allEntries.length} entries fetched`);

  /* Fetch all assets for image embedding */
  console.log("🖼️  Fetching assets…");
  const assetMap: AssetMap = {};
  let aSkip = 0;
  let aTotal = Infinity;
  while (aSkip < aTotal) {
    const aPage = await client.getAssets({ limit: PAGE, skip: aSkip });
    aTotal = aPage.total;
    for (const a of aPage.items) {
      const file = localizedField<any>(a.fields.file);
      const title = localizedField<string>(a.fields.title) ?? "";
      const description = localizedField<string>(a.fields.description) ?? "";
      assetMap[a.sys.id] = {
        url: file?.url ? `https:${file.url}` : "",
        title,
        description,
      };
    }
    aSkip += PAGE;
  }
  console.log(`  ✓ ${Object.keys(assetMap).length} assets indexed`);

  /* Group entries by category */
  const grouped: Record<string, any[]> = {};
  for (const entry of allEntries) {
    const cat = localizedField<string>(entry.fields.category) ?? "unknown";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(entry);
  }

  /* Clear old content directory */
  await fs.rm(CONTENT_DIR, { recursive: true, force: true });
  await fs.mkdir(CONTENT_DIR, { recursive: true });

  const renderOpts = buildRichTextOptions(assetMap);

  /* Write a master categories.json */
  const categories = Object.entries(CATEGORY_DIR_MAP).map(([key, dir]) => ({
    id: dir,
    name: CATEGORY_DISPLAY[key] ?? key,
    category: key,
    count: (grouped[key] ?? []).length,
  }));
  await fs.writeFile(path.join(CONTENT_DIR, "categories.json"), JSON.stringify(categories, null, 2));

  /* For each category, write list.json + per-entry files */
  for (const [cat, entries] of Object.entries(grouped)) {
    const dirSlug = CATEGORY_DIR_MAP[cat];
    if (!dirSlug) {
      console.warn(`  ⚠ Unknown category "${cat}" — skipping ${entries.length} entries`);
      continue;
    }

    const catDir = path.join(CONTENT_DIR, dirSlug);
    await fs.mkdir(catDir, { recursive: true });

    const listItems: any[] = [];

    for (const entry of entries) {
      const title: string = localizedField<string>(entry.fields.title) ?? "Untitled";
      const slug = slugify(title);
      const heroImageField: any = localizedField<any>(entry.fields.heroImage);
      const heroImageRef = heroImageField?.sys?.id;
      const heroImage = heroImageRef ? assetMap[heroImageRef] : null;
      const richText: Document | null = localizedField<Document>(entry.fields.content) ?? null;
      const order: number = localizedField<number>(entry.fields.order) ?? 0;

      /* entry.json */
      const entryData = {
        id: entry.sys.id,
        title,
        slug,
        category: cat,
        categoryDir: dirSlug,
        heroImage: heroImage ? { url: heroImage.url, alt: heroImage.title } : null,
        updatedAt: entry.sys.updatedAt,
        order,
      };

      const entryDir = path.join(catDir, slug);
      await fs.mkdir(entryDir, { recursive: true });
      await fs.writeFile(path.join(entryDir, "entry.json"), JSON.stringify(entryData, null, 2));

      /* content.html */
      let html = "";
      if (richText) {
        try {
          html = documentToHtmlString(richText, renderOpts);
        } catch {
          html = `<p>Error rendering content for "${title}".</p>`;
        }
      }
      await fs.writeFile(path.join(entryDir, "content.html"), html);

      listItems.push({
        id: entry.sys.id,
        title,
        slug,
        heroImage: heroImage ? { url: heroImage.url, alt: heroImage.title } : null,
        order,
      });
    }

    /* list.json — sorted alphabetically */
    listItems.sort((a, b) => a.order - b.order);
    await fs.writeFile(path.join(catDir, "list.json"), JSON.stringify(listItems, null, 2));
    console.log(`  📁 ${dirSlug}/  (${listItems.length} entries)`);
  }

  /* Build content/index.json — list of all content URL paths for the service worker */
  const allContentPaths: string[] = ["/content/categories.json"];
  const walkDir = async (dir: string, urlPrefix: string): Promise<void> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      const fullPath = path.join(dir, ent.name);
      const urlPath = `${urlPrefix}/${ent.name}`;
      if (ent.isDirectory()) {
        await walkDir(fullPath, urlPath);
      } else if (ent.name !== "index.json") {
        // Strip .html extension to match the URL paths the app actually fetches
        const servePath = ent.name.endsWith(".html") ? urlPath.replace(/\.html$/, "") : urlPath;
        allContentPaths.push(servePath);
      }
    }
  };
  await walkDir(CONTENT_DIR, "/content");
  await fs.writeFile(
    path.join(CONTENT_DIR, "index.json"),
    JSON.stringify(allContentPaths, null, 2),
  );
  console.log(`  📋 index.json  (${allContentPaths.length} paths)`);

  console.log("\n✅ Content build complete!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
