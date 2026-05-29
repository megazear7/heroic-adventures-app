import { z } from "zod";

export const DEFAULT_CHARACTER_HEALTH = 10;
export const DEFAULT_CHARACTER_STAT_VALUE = 0;
export const DEFAULT_CHARACTER_INITIATIVE = 0;

export const WEAPON_TRAINING_TYPES = ["blade", "axe", "blunt", "polearm", "ranged"] as const;
export type WeaponTrainingType = (typeof WEAPON_TRAINING_TYPES)[number];

export const DEFAULT_CHARACTER_WEAPON_TRAINING: Record<WeaponTrainingType, number> = {
  blade: 0,
  axe: 0,
  blunt: 0,
  polearm: 0,
  ranged: 0,
};

export const CharacterContentLink = z.object({
  id: z.string(),
  title: z.string().min(1),
  slug: z.string(),
  categoryId: z.string(),
  categoryName: z.string(),
  subcategory: z.string().nullable().optional(),
  heroImage: z
    .object({
      url: z.string(),
      alt: z.string(),
    })
    .nullable()
    .optional(),
  excerpt: z.string().optional(),
});
export type CharacterContentLink = z.infer<typeof CharacterContentLink>;

export const CharacterWeaponTrainingSchema = z.object({
  blade: z.number().int().min(0).max(5).default(DEFAULT_CHARACTER_WEAPON_TRAINING.blade),
  axe: z.number().int().min(0).max(5).default(DEFAULT_CHARACTER_WEAPON_TRAINING.axe),
  blunt: z.number().int().min(0).max(5).default(DEFAULT_CHARACTER_WEAPON_TRAINING.blunt),
  polearm: z.number().int().min(0).max(5).default(DEFAULT_CHARACTER_WEAPON_TRAINING.polearm),
  ranged: z.number().int().min(0).max(5).default(DEFAULT_CHARACTER_WEAPON_TRAINING.ranged),
});
export type CharacterWeaponTraining = z.infer<typeof CharacterWeaponTrainingSchema>;

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  archived: z.boolean().optional(),
  health: z.number().int().min(1).default(DEFAULT_CHARACTER_HEALTH),
  skill: z.number().int().min(0).default(DEFAULT_CHARACTER_STAT_VALUE),
  agility: z.number().int().min(0).default(DEFAULT_CHARACTER_STAT_VALUE),
  aim: z.number().int().min(0).default(DEFAULT_CHARACTER_STAT_VALUE),
  tactics: z.number().int().min(0).default(DEFAULT_CHARACTER_STAT_VALUE),
  intelligence: z.number().int().min(0).default(DEFAULT_CHARACTER_STAT_VALUE),
  willpower: z.number().int().min(0).default(DEFAULT_CHARACTER_STAT_VALUE),
  strength: z.number().int().min(0).default(DEFAULT_CHARACTER_STAT_VALUE),
  initiative: z.number().int().min(0).default(DEFAULT_CHARACTER_INITIATIVE),
  weaponTraining: CharacterWeaponTrainingSchema.default(DEFAULT_CHARACTER_WEAPON_TRAINING),
  race: CharacterContentLink,
  class: CharacterContentLink,
  background: CharacterContentLink,
  flaw: CharacterContentLink,
  spells: z.array(CharacterContentLink),
  features: z.array(CharacterContentLink),
  feats: z.array(CharacterContentLink),
  expertise: z.array(CharacterContentLink),
  gear: z.array(CharacterContentLink).default([]),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Character = z.infer<typeof CharacterSchema>;

export type CharacterSingleSelectionKey = "race" | "class" | "background" | "flaw";
export type CharacterMultiSelectionKey = "spells" | "features" | "feats" | "expertise" | "gear";
export type CharacterSelectionKey = CharacterSingleSelectionKey | CharacterMultiSelectionKey;
