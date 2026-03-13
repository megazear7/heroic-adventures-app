import z from "zod";

const PROFILES_KEY = "heroic-profiles";
const ACTIVE_PROFILE_KEY = "heroic-active-profile";

/** Color palette for random avatar colors */
const AVATAR_COLORS = [
  "#c9a84c", // gold
  "#5b8a72", // forest green
  "#7b5ea7", // purple
  "#c0392b", // crimson
  "#2980b9", // royal blue
  "#d35400", // burnt orange
  "#1abc9c", // teal
  "#8e44ad", // amethyst
  "#27ae60", // emerald
  "#e74c3c", // red
  "#f39c12", // amber
  "#2c3e50", // dark navy
  "#16a085", // sea green
  "#e67e22", // carrot
  "#9b59b6", // wisteria
  "#3498db", // sky blue
];

/** A single user profile */
export const UserProfile = z.object({
  id: z.string(),
  name: z.string(),
  color1: z.string(),
  color2: z.string(),
  initials: z.string(),
  createdAt: z.number(),
});
export type UserProfile = z.infer<typeof UserProfile>;

/** Custom event fired when profile data changes */
export const PROFILE_CHANGED_EVENT = "heroic-profile-changed";

function dispatchProfileChanged(): void {
  window.dispatchEvent(new CustomEvent(PROFILE_CHANGED_EVENT));
}

/** Pick two distinct random colors from the palette */
function pickRandomColors(): [string, string] {
  const shuffled = [...AVATAR_COLORS].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

/** Derive initials from a name (max 2 chars) */
function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.trim().substring(0, 2).toUpperCase();
}

/** Generate a unique ID */
function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Read all profiles from localStorage */
export function getAllProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return z.array(UserProfile).parse(parsed);
  } catch {
    return [];
  }
}

/** Save all profiles to localStorage */
function saveProfiles(profiles: UserProfile[]): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

/** Get the active profile ID */
export function getActiveProfileId(): string | null {
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
}

/** Set the active profile ID */
export function setActiveProfileId(id: string): void {
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  dispatchProfileChanged();
}

/** Get the currently active profile, or null */
export function getActiveProfile(): UserProfile | null {
  const id = getActiveProfileId();
  if (!id) return null;
  return getAllProfiles().find((p) => p.id === id) ?? null;
}

/** Create a new profile and set it as active. Returns the new profile. */
export function createProfile(name: string): UserProfile {
  const [color1, color2] = pickRandomColors();
  const profile: UserProfile = {
    id: generateId(),
    name: name.trim(),
    color1,
    color2,
    initials: deriveInitials(name),
    createdAt: Date.now(),
  };
  const profiles = getAllProfiles();
  profiles.push(profile);
  saveProfiles(profiles);
  setActiveProfileId(profile.id);
  return profile;
}

/** Update an existing profile's name and/or colors */
export function updateProfile(
  id: string,
  updates: { name?: string; color1?: string; color2?: string },
): UserProfile | null {
  const profiles = getAllProfiles();
  const idx = profiles.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  if (updates.name !== undefined) {
    profiles[idx].name = updates.name.trim();
    profiles[idx].initials = deriveInitials(updates.name);
  }
  if (updates.color1 !== undefined) profiles[idx].color1 = updates.color1;
  if (updates.color2 !== undefined) profiles[idx].color2 = updates.color2;

  saveProfiles(profiles);
  dispatchProfileChanged();
  return profiles[idx];
}

/** Delete a profile. If it was active, clears active. Returns true if found. */
export function deleteProfile(id: string): boolean {
  const profiles = getAllProfiles();
  const filtered = profiles.filter((p) => p.id !== id);
  if (filtered.length === profiles.length) return false;

  saveProfiles(filtered);

  // Clean up profile-scoped storage
  localStorage.removeItem(`heroic-favorites-${id}`);
  localStorage.removeItem(`heroic-recent-${id}`);
  sessionStorage.removeItem(`heroic-bookmarks-${id}`);

  if (getActiveProfileId() === id) {
    // Switch to another profile or clear
    if (filtered.length > 0) {
      setActiveProfileId(filtered[0].id);
    } else {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  }

  dispatchProfileChanged();
  return true;
}

/** Switch to an existing profile */
export function switchProfile(id: string): boolean {
  const profiles = getAllProfiles();
  if (!profiles.some((p) => p.id === id)) return false;
  setActiveProfileId(id);
  return true;
}

/** Export the color palette for the settings page */
export { AVATAR_COLORS };
