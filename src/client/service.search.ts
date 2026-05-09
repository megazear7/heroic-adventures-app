import { ContentCategory, ContentListItem, ContentSearchIndexEntry } from "../shared/type.content.js";

export interface SearchIndexedEntry extends ContentSearchIndexEntry {
  normalizedTitle: string;
  normalizedContent: string;
  searchTokens: string[];
  searchTokenSet: Set<string>;
}

const WORD_SPLIT_REGEX = /[^a-z0-9]+/g;
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

function toIndexedEntry(entry: ContentSearchIndexEntry): SearchIndexedEntry {
  const normalizedTitle = normalizeText(entry.title);
  const normalizedContent = normalizeText(entry.contentText ?? "");

  const tokens = uniqueSorted([
    ...tokenize(entry.title),
    ...tokenize(entry.subcategory ?? ""),
    ...tokenize(entry.categoryName),
    ...tokenize(entry.contentText ?? ""),
  ]);

  return {
    ...entry,
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
          results.push(
            toIndexedEntry({
              id: item.id,
              title: item.title,
              slug: item.slug,
              categoryId: category.id,
              categoryName: category.name,
              subcategory: item.subcategory ?? null,
              heroImage: item.heroImage,
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
