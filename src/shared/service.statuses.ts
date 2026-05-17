import { getActiveProfileId } from "./service.profile.js";

const STATUSES_STORAGE_PREFIX = "heroic-statuses";

/** Custom event fired when the status library changes */
export const STATUSES_CHANGED_EVENT = "heroic-statuses-changed";

function storageKey(): string {
  const id = getActiveProfileId();
  return id ? `${STATUSES_STORAGE_PREFIX}-${id}` : STATUSES_STORAGE_PREFIX;
}

function dispatchStatusesChanged(): void {
  window.dispatchEvent(new CustomEvent(STATUSES_CHANGED_EVENT));
}

function saveStatuses(statuses: string[]): void {
  localStorage.setItem(storageKey(), JSON.stringify(statuses));
  dispatchStatusesChanged();
}

/** Returns the current list of saved status names for the active profile. */
export function getStatuses(): string[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
  } catch {
    return [];
  }
}

/** Adds a status name to the library. No-op if it already exists or is blank. */
export function addStatus(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const current = getStatuses();
  if (current.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
  saveStatuses([...current, trimmed]);
}

/** Removes a status name from the library. */
export function removeStatus(name: string): void {
  saveStatuses(getStatuses().filter((s) => s !== name));
}
