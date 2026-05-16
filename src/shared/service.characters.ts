import { z } from "zod";
import {
  Character,
  CharacterContentLink,
  DEFAULT_CHARACTER_HEALTH,
  CharacterMultiSelectionKey,
  CharacterSchema,
  CharacterSelectionKey,
  CharacterSingleSelectionKey,
} from "./type.character.js";
import { getActiveProfileId } from "./service.profile.js";

const CHARACTER_STORAGE_PREFIX = "heroic-characters";
const CHARACTER_DRAFT_PREFIX = "heroic-character-draft";

const LegacyCharacterSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  health: z.number().int().min(1).optional().default(DEFAULT_CHARACTER_HEALTH),
  race: z.string().min(1),
  class: z.string().min(1),
  background: z.string().min(1),
  flaw: z.string().min(1),
  spells: z.array(z.string()).optional().default([]),
  features: z.array(z.string()).optional().default([]),
  feats: z.array(z.string()).optional().default([]),
  expertise: z.array(z.string()).optional().default([]),
  gear: z.array(z.string()).optional().default([]),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const CHARACTERS_CHANGED_EVENT = "heroic-characters-changed";

type LegacyCharacter = z.infer<typeof LegacyCharacterSchema>;

const SINGLE_CATEGORY_CONFIG: Record<CharacterSingleSelectionKey, { categoryId: string; categoryName: string }> = {
  race: { categoryId: "races", categoryName: "Races" },
  class: { categoryId: "classes", categoryName: "Classes" },
  background: { categoryId: "backgrounds", categoryName: "Backgrounds" },
  flaw: { categoryId: "flaws", categoryName: "Flaws" },
};

function storageKey(prefix: string): string {
  const id = getActiveProfileId();
  return id ? `${prefix}-${id}` : prefix;
}

function dispatchCharactersChanged(): void {
  window.dispatchEvent(new CustomEvent(CHARACTERS_CHANGED_EVENT));
}

function legacyLink(title: string, categoryId: string, categoryName: string): CharacterContentLink {
  return {
    id: `legacy:${categoryId}:${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title,
    slug: "",
    categoryId,
    categoryName,
    subcategory: null,
    heroImage: null,
    excerpt: "Imported from a legacy character record.",
  };
}

function migrateLegacyCharacter(character: LegacyCharacter): Character {
  return {
    id: character.id,
    name: character.name,
    health: character.health,
    race: legacyLink(character.race, SINGLE_CATEGORY_CONFIG.race.categoryId, SINGLE_CATEGORY_CONFIG.race.categoryName),
    class: legacyLink(
      character.class,
      SINGLE_CATEGORY_CONFIG.class.categoryId,
      SINGLE_CATEGORY_CONFIG.class.categoryName,
    ),
    background: legacyLink(
      character.background,
      SINGLE_CATEGORY_CONFIG.background.categoryId,
      SINGLE_CATEGORY_CONFIG.background.categoryName,
    ),
    flaw: legacyLink(character.flaw, SINGLE_CATEGORY_CONFIG.flaw.categoryId, SINGLE_CATEGORY_CONFIG.flaw.categoryName),
    spells: character.spells.map((title) => legacyLink(title, "spells-legacy", "Spells")),
    features: character.features.map((title) => legacyLink(title, "features", "Features")),
    feats: character.feats.map((title) => legacyLink(title, "feats", "Feats")),
    expertise: character.expertise.map((title) => legacyLink(title, "expertise", "Expertise")),
    gear: character.gear.map((title) => legacyLink(title, "items-legacy", "Gear")),
    createdAt: character.createdAt,
    updatedAt: character.updatedAt,
  };
}

function normalizeCharacter(value: unknown): Character | null {
  const parsed = CharacterSchema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }

  const legacy = LegacyCharacterSchema.safeParse(value);
  if (legacy.success) {
    return migrateLegacyCharacter(legacy.data);
  }

  return null;
}

function saveCharacters(characters: Character[]): void {
  localStorage.setItem(storageKey(CHARACTER_STORAGE_PREFIX), JSON.stringify(characters));
  dispatchCharactersChanged();
}

export function getCharacters(): Character[] {
  try {
    const raw = localStorage.getItem(storageKey(CHARACTER_STORAGE_PREFIX));
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const characters = parsed
      .map((item) => normalizeCharacter(item))
      .filter((item): item is Character => item !== null);
    const needsRewrite =
      characters.length !== parsed.length ||
      parsed.some((item, index) => CharacterSchema.safeParse(item).success === false && characters[index]);
    if (needsRewrite) {
      localStorage.setItem(storageKey(CHARACTER_STORAGE_PREFIX), JSON.stringify(characters));
    }
    return characters;
  } catch {
    return [];
  }
}

export function getCharacterDraft<T>(fallback: T): T {
  try {
    const raw = localStorage.getItem(storageKey(CHARACTER_DRAFT_PREFIX));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveCharacterDraft(value: unknown): void {
  localStorage.setItem(storageKey(CHARACTER_DRAFT_PREFIX), JSON.stringify(value));
}

export function clearCharacterDraft(): void {
  localStorage.removeItem(storageKey(CHARACTER_DRAFT_PREFIX));
}

export function upsertCharacter(character: Character): Character {
  const characters = getCharacters();
  const next = [...characters];
  const index = next.findIndex((item) => item.id === character.id);
  if (index >= 0) {
    next[index] = character;
  } else {
    next.unshift(character);
  }
  saveCharacters(next);
  return character;
}

export function deleteCharacter(characterId: string): void {
  saveCharacters(getCharacters().filter((character) => character.id !== characterId));
}

export function createCharacterContentLink(entry: {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  subcategory?: string | null;
  heroImage?: { url: string; alt: string } | null;
  excerpt?: string;
}): CharacterContentLink {
  return CharacterContentLink.parse({
    id: entry.id,
    title: entry.title,
    slug: entry.slug,
    categoryId: entry.categoryId,
    categoryName: entry.categoryName,
    subcategory: entry.subcategory ?? null,
    heroImage: entry.heroImage ?? null,
    excerpt: entry.excerpt,
  });
}

export function getCharacterSelectionKeyForCategory(categoryId: string): CharacterSelectionKey | null {
  if (categoryId === "races") return "race";
  if (categoryId === "classes") return "class";
  if (categoryId === "backgrounds") return "background";
  if (categoryId === "flaws") return "flaw";
  if (categoryId === "features") return "features";
  if (categoryId === "feats") return "feats";
  if (categoryId === "expertise") return "expertise";
  if (categoryId.startsWith("spells-")) return "spells";
  if (categoryId.startsWith("items-")) return "gear";
  return null;
}

export function isCharacterAssignableCategory(categoryId: string): boolean {
  return getCharacterSelectionKeyForCategory(categoryId) !== null;
}

function isSingleSelectionKey(key: CharacterSelectionKey): key is CharacterSingleSelectionKey {
  return key === "race" || key === "class" || key === "background" || key === "flaw";
}

function isMultiSelectionKey(key: CharacterSelectionKey): key is CharacterMultiSelectionKey {
  return !isSingleSelectionKey(key);
}

export function addEntryToCharacter(characterId: string, link: CharacterContentLink): Character | null {
  const key = getCharacterSelectionKeyForCategory(link.categoryId);
  if (!key) {
    return null;
  }

  const characters = getCharacters();
  const index = characters.findIndex((character) => character.id === characterId);
  if (index === -1) {
    return null;
  }

  const current = characters[index];
  const updatedAt = Date.now();

  let nextCharacter: Character;
  if (isSingleSelectionKey(key)) {
    nextCharacter = {
      ...current,
      [key]: link,
      updatedAt,
    };
  } else if (isMultiSelectionKey(key)) {
    const existing = current[key];
    const alreadySelected = existing.some((item) => item.categoryId === link.categoryId && item.slug === link.slug);
    nextCharacter = {
      ...current,
      [key]: alreadySelected ? existing : [...existing, link],
      updatedAt,
    };
  } else {
    return null;
  }

  characters[index] = nextCharacter;
  saveCharacters(characters);
  return nextCharacter;
}
