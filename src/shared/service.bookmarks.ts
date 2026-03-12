import z from "zod";

const STORAGE_KEY = "heroic-bookmarks";
const MAX_BOOKMARKS = 5;

/** A single bookmark entry reference */
export const BookmarkEntry = z.object({
  categoryId: z.string(),
  slug: z.string(),
  title: z.string(),
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
});
export type BookmarkEntry = z.infer<typeof BookmarkEntry>;

/** Read all bookmarks from sessionStorage */
export function getBookmarks(): BookmarkEntry[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return z.array(BookmarkEntry).parse(parsed);
  } catch {
    return [];
  }
}

/** Check whether an entry is bookmarked */
export function isBookmarked(categoryId: string, slug: string): boolean {
  return getBookmarks().some((b) => b.categoryId === categoryId && b.slug === slug);
}

/** Add an entry to bookmarks. Returns false if already at max capacity. */
export function addBookmark(entry: BookmarkEntry): boolean {
  const bookmarks = getBookmarks();
  if (bookmarks.some((b) => b.categoryId === entry.categoryId && b.slug === entry.slug)) {
    return true; // already bookmarked
  }
  if (bookmarks.length >= MAX_BOOKMARKS) {
    return false; // at capacity
  }
  bookmarks.push(entry);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  dispatchBookmarksChanged();
  return true;
}

/** Remove an entry from bookmarks */
export function removeBookmark(categoryId: string, slug: string): void {
  const bookmarks = getBookmarks().filter((b) => !(b.categoryId === categoryId && b.slug === slug));
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  dispatchBookmarksChanged();
}

/** Toggle an entry's bookmark status. Returns new state (true = bookmarked). */
export function toggleBookmark(entry: BookmarkEntry): boolean {
  if (isBookmarked(entry.categoryId, entry.slug)) {
    removeBookmark(entry.categoryId, entry.slug);
    return false;
  } else {
    return addBookmark(entry);
  }
}

/** Custom event name components can listen for */
export const BOOKMARKS_CHANGED_EVENT = "heroic-bookmarks-changed";

function dispatchBookmarksChanged(): void {
  window.dispatchEvent(new CustomEvent(BOOKMARKS_CHANGED_EVENT));
}
