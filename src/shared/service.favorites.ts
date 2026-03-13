import z from "zod";
import { getActiveProfileId } from "./service.profile.js";

function storageKey(): string {
  const id = getActiveProfileId();
  return id ? `heroic-favorites-${id}` : "heroic-favorites";
}

/** A single favorite entry reference */
export const FavoriteEntry = z.object({
  categoryId: z.string(),
  slug: z.string(),
  title: z.string(),
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
});
export type FavoriteEntry = z.infer<typeof FavoriteEntry>;

/** Read all favorites from localStorage */
export function getFavorites(): FavoriteEntry[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return z.array(FavoriteEntry).parse(parsed);
  } catch {
    return [];
  }
}

/** Check whether an entry is favorited */
export function isFavorite(categoryId: string, slug: string): boolean {
  return getFavorites().some((f) => f.categoryId === categoryId && f.slug === slug);
}

/** Add an entry to favorites */
export function addFavorite(entry: FavoriteEntry): void {
  const favorites = getFavorites();
  if (!favorites.some((f) => f.categoryId === entry.categoryId && f.slug === entry.slug)) {
    favorites.push(entry);
    localStorage.setItem(storageKey(), JSON.stringify(favorites));
    dispatchFavoritesChanged();
  }
}

/** Remove an entry from favorites */
export function removeFavorite(categoryId: string, slug: string): void {
  const favorites = getFavorites().filter((f) => !(f.categoryId === categoryId && f.slug === slug));
  localStorage.setItem(storageKey(), JSON.stringify(favorites));
  dispatchFavoritesChanged();
}

/** Toggle an entry's favorite status. Returns new state. */
export function toggleFavorite(entry: FavoriteEntry): boolean {
  if (isFavorite(entry.categoryId, entry.slug)) {
    removeFavorite(entry.categoryId, entry.slug);
    return false;
  } else {
    addFavorite(entry);
    return true;
  }
}

/** Custom event name components can listen for */
export const FAVORITES_CHANGED_EVENT = "heroic-favorites-changed";

function dispatchFavoritesChanged(): void {
  window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT));
}
