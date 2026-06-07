import z from "zod";

const PROFILES_KEY = "heroic-profiles";
const ACTIVE_PROFILE_KEY = "heroic-active-profile";
const PROFILE_EXPORT_FORMAT = "heroicadventures-profile";
const PROFILE_EXPORT_VERSION = 1;

const PROFILE_STORAGE_KEYS = {
  favorites: (id: string) => `heroic-favorites-${id}`,
  recents: (id: string) => `heroic-recent-${id}`,
  bookmarks: (id: string) => `heroic-bookmarks-${id}`,
  characters: (id: string) => `heroic-characters-${id}`,
  characterDraft: (id: string) => `heroic-character-draft-${id}`,
  encounters: (id: string) => `heroic-encounters-${id}`,
  monsterTemplates: (id: string) => `heroic-monster-templates-${id}`,
  statuses: (id: string) => `heroic-statuses-${id}`,
} as const;

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

const ExportedProfileData = z.object({
  format: z.literal(PROFILE_EXPORT_FORMAT),
  version: z.literal(PROFILE_EXPORT_VERSION),
  exportedAt: z.number(),
  profile: UserProfile,
  data: z.object({
    favorites: z.array(z.unknown()),
    recents: z.array(z.unknown()),
    bookmarks: z.array(z.unknown()),
    characters: z.array(z.unknown()),
    characterDraft: z.unknown().optional(),
    encounters: z.array(z.unknown()),
    monsterTemplates: z.array(z.unknown()),
    statuses: z.array(z.string()),
  }),
});

export type ExportedProfileData = z.infer<typeof ExportedProfileData>;

/** Custom event fired when profile data changes */
export const PROFILE_CHANGED_EVENT = "heroic-profile-changed";

function dispatchProfileChanged(): void {
  window.dispatchEvent(new CustomEvent(PROFILE_CHANGED_EVENT));
}

function readStoredJson<T>(storage: Storage, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredJson(storage: Storage, key: string, value: unknown): void {
  if (value === undefined) {
    storage.removeItem(key);
    return;
  }
  storage.setItem(key, JSON.stringify(value));
}

function removeProfileStorage(id: string): void {
  localStorage.removeItem(PROFILE_STORAGE_KEYS.favorites(id));
  localStorage.removeItem(PROFILE_STORAGE_KEYS.recents(id));
  sessionStorage.removeItem(PROFILE_STORAGE_KEYS.bookmarks(id));
  localStorage.removeItem(PROFILE_STORAGE_KEYS.characters(id));
  localStorage.removeItem(PROFILE_STORAGE_KEYS.characterDraft(id));
  localStorage.removeItem(PROFILE_STORAGE_KEYS.encounters(id));
  localStorage.removeItem(PROFILE_STORAGE_KEYS.monsterTemplates(id));
  localStorage.removeItem(PROFILE_STORAGE_KEYS.statuses(id));
}

function slugifyFileNameSegment(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "profile";
}

function resolveImportedProfileName(name: string, profiles: UserProfile[]): string {
  const trimmedName = name.trim();
  if (!profiles.some((profile) => profile.name === trimmedName)) {
    return trimmedName;
  }

  let suffix = 2;
  let nextName = `${trimmedName} #${suffix}`;
  while (profiles.some((profile) => profile.name === nextName)) {
    suffix += 1;
    nextName = `${trimmedName} #${suffix}`;
  }

  return nextName;
}

function buildExportPayload(profile: UserProfile): ExportedProfileData {
  return {
    format: PROFILE_EXPORT_FORMAT,
    version: PROFILE_EXPORT_VERSION,
    exportedAt: Date.now(),
    profile,
    data: {
      favorites: readStoredJson(localStorage, PROFILE_STORAGE_KEYS.favorites(profile.id), []),
      recents: readStoredJson(localStorage, PROFILE_STORAGE_KEYS.recents(profile.id), []),
      bookmarks: readStoredJson(sessionStorage, PROFILE_STORAGE_KEYS.bookmarks(profile.id), []),
      characters: readStoredJson(localStorage, PROFILE_STORAGE_KEYS.characters(profile.id), []),
      characterDraft: readStoredJson(localStorage, PROFILE_STORAGE_KEYS.characterDraft(profile.id), undefined),
      encounters: readStoredJson(localStorage, PROFILE_STORAGE_KEYS.encounters(profile.id), []),
      monsterTemplates: readStoredJson(localStorage, PROFILE_STORAGE_KEYS.monsterTemplates(profile.id), []),
      statuses: readStoredJson(localStorage, PROFILE_STORAGE_KEYS.statuses(profile.id), []),
    },
  };
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
  removeProfileStorage(id);

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

export function buildProfileExportFileName(name: string): string {
  return `${slugifyFileNameSegment(name)}.${PROFILE_EXPORT_FORMAT}.json`;
}

export function getProfileExportFile(profileId: string): { fileName: string; content: string } | null {
  const profile = getAllProfiles().find((item) => item.id === profileId);
  if (!profile) {
    return null;
  }

  return {
    fileName: buildProfileExportFileName(profile.name),
    content: JSON.stringify(buildExportPayload(profile), null, 2),
  };
}

export function importProfileFromFileContent(content: string): UserProfile {
  const parsed = ExportedProfileData.parse(JSON.parse(content));
  const profiles = getAllProfiles();
  const importedName = resolveImportedProfileName(parsed.profile.name, profiles);
  const importedProfile: UserProfile = {
    ...parsed.profile,
    id: generateId(),
    name: importedName,
    initials: deriveInitials(importedName),
  };

  profiles.push(importedProfile);
  saveProfiles(profiles);

  writeStoredJson(localStorage, PROFILE_STORAGE_KEYS.favorites(importedProfile.id), parsed.data.favorites);
  writeStoredJson(localStorage, PROFILE_STORAGE_KEYS.recents(importedProfile.id), parsed.data.recents);
  writeStoredJson(sessionStorage, PROFILE_STORAGE_KEYS.bookmarks(importedProfile.id), parsed.data.bookmarks);
  writeStoredJson(localStorage, PROFILE_STORAGE_KEYS.characters(importedProfile.id), parsed.data.characters);
  writeStoredJson(localStorage, PROFILE_STORAGE_KEYS.characterDraft(importedProfile.id), parsed.data.characterDraft);
  writeStoredJson(localStorage, PROFILE_STORAGE_KEYS.encounters(importedProfile.id), parsed.data.encounters);
  writeStoredJson(
    localStorage,
    PROFILE_STORAGE_KEYS.monsterTemplates(importedProfile.id),
    parsed.data.monsterTemplates,
  );
  writeStoredJson(localStorage, PROFILE_STORAGE_KEYS.statuses(importedProfile.id), parsed.data.statuses);

  setActiveProfileId(importedProfile.id);
  return importedProfile;
}

/** Export the color palette for the settings page */
export { AVATAR_COLORS };
