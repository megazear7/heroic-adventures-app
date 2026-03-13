import z from "zod";
import { getActiveProfileId } from "./service.profile.js";

function storageKey(): string {
  const id = getActiveProfileId();
  return id ? `heroic-recent-${id}` : "heroic-recent";
}
const MAX_RECENT = 10;

/** A single recently viewed entry reference */
export const RecentEntry = z.object({
  categoryId: z.string(),
  slug: z.string(),
  title: z.string(),
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
  viewedAt: z.number(),
});
export type RecentEntry = z.infer<typeof RecentEntry>;

/** Read all recent entries from localStorage, newest first */
export function getRecentEntries(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return z
      .array(RecentEntry)
      .parse(parsed)
      .sort((a, b) => b.viewedAt - a.viewedAt);
  } catch {
    return [];
  }
}

/** Record a viewed entry. Moves it to the top if already present. Caps at MAX_RECENT. */
export function recordRecentEntry(entry: Omit<RecentEntry, "viewedAt">): void {
  const recents = getRecentEntries().filter(
    (r) => !(r.categoryId === entry.categoryId && r.slug === entry.slug),
  );
  recents.unshift({ ...entry, viewedAt: Date.now() });
  localStorage.setItem(storageKey(), JSON.stringify(recents.slice(0, MAX_RECENT)));
  dispatchRecentsChanged();
}

/** Custom event name components can listen for */
export const RECENTS_CHANGED_EVENT = "heroic-recents-changed";

function dispatchRecentsChanged(): void {
  window.dispatchEvent(new CustomEvent(RECENTS_CHANGED_EVENT));
}
