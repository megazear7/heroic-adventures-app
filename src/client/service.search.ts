import { ContentCategory, ContentListItem, ContentSearchIndexEntry } from "../shared/type.content.js";

export interface SearchIndexedEntry extends ContentSearchIndexEntry {
  normalizedTitle: string;
  normalizedContent: string;
  searchTokens: string[];
  searchTokenSet: Set<string>;
}

export interface SearchFilters {
  levels: Set<number>;
  classes: Set<string>;
  tags: Set<string>;
}

const WORD_SPLIT_REGEX = /[^a-z0-9]+/g;
const MAX_TAGS_PER_ENTRY = 20;
const MAX_FUZZY_CANDIDATE_CHECKS = 60;

let cachedIndexPromise: Promise<SearchIndexedEntry[]> | null = null;

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(WORD_SPLIT_REGEX)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function uniqueSorted(values: Iterable<string>): string[] {
  return Array.from(new Set(Array.from(values).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function parseLevelFromText(value: string): number | null {
  const levelMatch = value.match(/\b(?:level|lvl)\s*(\d{1,2})\b/i);
  if (levelMatch) {
    return Number(levelMatch[1]);
  }

  const ordinalMatch = value.match(/\b(\d{1,2})(?:st|nd|rd|th)\s+level\b/i);
  if (ordinalMatch) {
    return Number(ordinalMatch[1]);
  }

  return null;
}

function parseClassFromText(value: string): string | null {
  const classMatch = value.match(/\bclass(?:es)?\s*[:\-]\s*([a-zA-Z ,/]+)/i);
  if (!classMatch) return null;
  return (
    classMatch[1]
      .split(/[,/]/)
      .map((item) => item.trim())
      .find(Boolean) ?? null
  );
}

function parseTagsFromText(value: string): string[] {
  const explicitTagLine = value.match(/\b(?:tags?|keywords?)\s*[:\-]\s*([^\n]+)/i);
  if (explicitTagLine) {
    return uniqueSorted(
      explicitTagLine[1]
        .split(/[,/|]/)
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item.length > 1),
    );
  }
  return [];
}

function buildDerivedTags(entry: ContentSearchIndexEntry): string[] {
  const derived = new Set<string>();

  derived.add(entry.categoryName.toLowerCase());
  if (entry.subcategory) {
    derived.add(entry.subcategory.toLowerCase());
  }

  for (const token of tokenize(`${entry.title} ${entry.subcategory ?? ""}`)) {
    if (token.length > 2) {
      derived.add(token);
    }
  }

  for (const tag of entry.tags ?? []) {
    if (tag.length > 1) {
      derived.add(tag.toLowerCase());
    }
  }

  return uniqueSorted(derived).slice(0, MAX_TAGS_PER_ENTRY);
}

function toIndexedEntry(entry: ContentSearchIndexEntry): SearchIndexedEntry {
  const normalizedTitle = normalizeText(entry.title);
  const normalizedContent = normalizeText(entry.contentText ?? "");

  const tokens = uniqueSorted([
    ...tokenize(entry.title),
    ...tokenize(entry.subcategory ?? ""),
    ...tokenize(entry.categoryName),
    ...tokenize(entry.className ?? ""),
    ...tokenize((entry.tags ?? []).join(" ")),
    ...tokenize(entry.contentText ?? ""),
  ]);

  return {
    ...entry,
    tags: buildDerivedTags(entry),
    normalizedTitle,
    normalizedContent,
    searchTokens: tokens,
    searchTokenSet: new Set(tokens),
  };
}

async function loadFallbackIndex(): Promise<SearchIndexedEntry[]> {
  const categoriesRes = await fetch("/content/categories.json");
  if (!categoriesRes.ok) {
    throw new Error("Unable to load category index");
  }
  const categories: ContentCategory[] = (await categoriesRes.json()).map((item: unknown) =>
    ContentCategory.parse(item),
  );

  const results: SearchIndexedEntry[] = [];
  await Promise.all(
    categories.map(async (category) => {
      try {
        const listRes = await fetch(`/content/${category.id}/list.json`);
        if (!listRes.ok) return;
        const list = (await listRes.json()).map((item: unknown) => ContentListItem.parse(item));
        for (const item of list) {
          const combined = `${item.title}\n${item.subcategory ?? ""}`;
          results.push(
            toIndexedEntry({
              id: item.id,
              title: item.title,
              slug: item.slug,
              categoryId: category.id,
              categoryName: category.name,
              subcategory: item.subcategory ?? null,
              heroImage: item.heroImage,
              level: parseLevelFromText(combined),
              className: parseClassFromText(combined),
              tags: parseTagsFromText(combined),
              contentText: "",
              order: item.order,
            }),
          );
        }
      } catch {
        // Skip categories that fail to load.
      }
    }),
  );

  return results;
}

export async function loadSearchIndex(): Promise<SearchIndexedEntry[]> {
  if (cachedIndexPromise) {
    return cachedIndexPromise;
  }

  cachedIndexPromise = (async () => {
    try {
      const res = await fetch("/content/search-index.json");
      if (!res.ok) {
        return loadFallbackIndex();
      }
      const data = await res.json();
      return data.map((item: unknown) => toIndexedEntry(ContentSearchIndexEntry.parse(item)));
    } catch {
      return loadFallbackIndex();
    }
  })();

  return cachedIndexPromise;
}

function computeLimitedLevenshteinDistance(a: string, b: string, limit = 2): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  if (a === b) return 0;

  const previous = new Array<number>(b.length + 1);
  const current = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) {
    previous[j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    let minInRow = current[0];

    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      if (current[j] < minInRow) {
        minInRow = current[j];
      }
    }

    if (minInRow > limit) {
      return limit + 1;
    }

    for (let j = 0; j <= b.length; j++) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

export function matchesFilters(entry: SearchIndexedEntry, filters: SearchFilters): boolean {
  if (filters.levels.size > 0 && (!entry.level || !filters.levels.has(entry.level))) {
    return false;
  }

  if (filters.classes.size > 0) {
    const className = (entry.className ?? "").toLowerCase();
    if (!className || !filters.classes.has(className)) {
      return false;
    }
  }

  if (filters.tags.size > 0) {
    const entryTags = new Set((entry.tags ?? []).map((tag) => tag.toLowerCase()));
    let hasAnyTag = false;
    for (const selectedTag of filters.tags) {
      if (entryTags.has(selectedTag)) {
        hasAnyTag = true;
        break;
      }
    }
    if (!hasAnyTag) return false;
  }

  return true;
}

export function scoreSearchEntry(query: string, entry: SearchIndexedEntry): number {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return 0;

  let score = 0;

  if (entry.normalizedTitle === normalizedQuery) score += 1000;
  if (entry.normalizedTitle.startsWith(normalizedQuery)) score += 700;
  if (entry.normalizedTitle.includes(normalizedQuery)) score += 500;
  if (entry.normalizedContent.includes(normalizedQuery)) score += 120;

  const queryTokens = tokenize(normalizedQuery);
  if (queryTokens.length === 0) return score;

  for (const token of queryTokens) {
    if (entry.searchTokenSet.has(token)) {
      score += 120;
      continue;
    }

    const partialMatch = entry.searchTokens.find((candidate) => candidate.includes(token));
    if (partialMatch) {
      score += 70;
      continue;
    }

    let fuzzyMatched = false;
    let checkedCandidates = 0;
    for (const candidate of entry.searchTokens) {
      if (Math.abs(candidate.length - token.length) > 2) continue;
      checkedCandidates++;
      if (checkedCandidates > MAX_FUZZY_CANDIDATE_CHECKS) {
        break;
      }
      if (computeLimitedLevenshteinDistance(token, candidate, 2) <= 2) {
        score += 35;
        fuzzyMatched = true;
        break;
      }
    }
    if (!fuzzyMatched) {
      score -= 10;
    }
  }

  score += Math.max(0, 40 - Math.min(entry.order, 40));

  return score;
}

export function buildFilterOptions(entries: SearchIndexedEntry[]): {
  levels: number[];
  classes: string[];
  tags: string[];
} {
  const levels = new Set<number>();
  const classes = new Set<string>();
  const tags = new Set<string>();

  for (const entry of entries) {
    if (entry.level && Number.isInteger(entry.level)) {
      levels.add(entry.level);
    }
    if (entry.className) {
      classes.add(entry.className.toLowerCase());
    }
    for (const tag of entry.tags ?? []) {
      tags.add(tag.toLowerCase());
    }
  }

  return {
    levels: Array.from(levels).sort((a, b) => a - b),
    classes: uniqueSorted(classes),
    tags: uniqueSorted(tags).slice(0, 80),
  };
}
