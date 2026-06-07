import { z } from "zod";

export const DEFAULT_CHARACTER_HEALTH = 10;
export const DEFAULT_CHARACTER_STAT_VALUE = 0;
export const DEFAULT_CHARACTER_INITIATIVE = 0;
export const DEFAULT_EQUIPMENT_PROFILE_BLOCK = 0;
export const DEFAULT_EQUIPMENT_PROFILE_TOUGHNESS = 0;
export const DEFAULT_EQUIPMENT_PROFILE_DAMAGE_DICE_COUNT = 1;
export const DEFAULT_EQUIPMENT_PROFILE_DAMAGE_DICE_SIZE = "d6" as const;
export const DEFAULT_EQUIPMENT_PROFILE_DAMAGE_BONUS = 0;
export const DEFAULT_EQUIPMENT_PROFILE_REMOVE_LOWEST = false;

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

export const EQUIPMENT_PROFILE_DAMAGE_DIE_SIZES = ["d4", "d6", "d8", "d10", "d12"] as const;
export type EquipmentProfileDamageDieSize = (typeof EQUIPMENT_PROFILE_DAMAGE_DIE_SIZES)[number];

export const CharacterEquipmentProfileDamageSchema = z.object({
  diceCount: z.number().int().min(1).default(DEFAULT_EQUIPMENT_PROFILE_DAMAGE_DICE_COUNT),
  diceSize: z.enum(EQUIPMENT_PROFILE_DAMAGE_DIE_SIZES).default(DEFAULT_EQUIPMENT_PROFILE_DAMAGE_DICE_SIZE),
  bonus: z.number().int().default(DEFAULT_EQUIPMENT_PROFILE_DAMAGE_BONUS),
  removeLowest: z.boolean().default(DEFAULT_EQUIPMENT_PROFILE_REMOVE_LOWEST),
});
export type CharacterEquipmentProfileDamage = z.infer<typeof CharacterEquipmentProfileDamageSchema>;

export const CharacterEquipmentProfileSchema = z.object({
  id: z.string(),
  primary: CharacterContentLink.nullable().optional().default(null),
  secondary: CharacterContentLink.nullable().optional().default(null),
  armor: CharacterContentLink.nullable().optional().default(null),
  skill: z.number().int().default(DEFAULT_CHARACTER_STAT_VALUE),
  aim: z.number().int().default(DEFAULT_CHARACTER_STAT_VALUE),
  block: z.number().int().min(0).default(DEFAULT_EQUIPMENT_PROFILE_BLOCK),
  initiative: z.number().int().min(0).default(DEFAULT_CHARACTER_INITIATIVE),
  agility: z.number().int().default(DEFAULT_CHARACTER_STAT_VALUE),
  tactics: z.number().int().default(DEFAULT_CHARACTER_STAT_VALUE),
  toughness: z.number().int().min(0).default(DEFAULT_EQUIPMENT_PROFILE_TOUGHNESS),
  damage: CharacterEquipmentProfileDamageSchema.default({
    diceCount: DEFAULT_EQUIPMENT_PROFILE_DAMAGE_DICE_COUNT,
    diceSize: DEFAULT_EQUIPMENT_PROFILE_DAMAGE_DICE_SIZE,
    bonus: DEFAULT_EQUIPMENT_PROFILE_DAMAGE_BONUS,
    removeLowest: DEFAULT_EQUIPMENT_PROFILE_REMOVE_LOWEST,
  }),
});
export type CharacterEquipmentProfile = z.infer<typeof CharacterEquipmentProfileSchema>;

function createEquipmentProfileId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `equipment-profile-${Math.random().toString(36).slice(2, 10)}`;
}

export function createDefaultEquipmentProfile(id = createEquipmentProfileId()): CharacterEquipmentProfile {
  return CharacterEquipmentProfileSchema.parse({
    id,
    primary: null,
    secondary: null,
    armor: null,
    skill: DEFAULT_CHARACTER_STAT_VALUE,
    aim: DEFAULT_CHARACTER_STAT_VALUE,
    block: DEFAULT_EQUIPMENT_PROFILE_BLOCK,
    initiative: DEFAULT_CHARACTER_INITIATIVE,
    agility: DEFAULT_CHARACTER_STAT_VALUE,
    tactics: DEFAULT_CHARACTER_STAT_VALUE,
    toughness: DEFAULT_EQUIPMENT_PROFILE_TOUGHNESS,
    damage: {
      diceCount: DEFAULT_EQUIPMENT_PROFILE_DAMAGE_DICE_COUNT,
      diceSize: DEFAULT_EQUIPMENT_PROFILE_DAMAGE_DICE_SIZE,
      bonus: DEFAULT_EQUIPMENT_PROFILE_DAMAGE_BONUS,
      removeLowest: DEFAULT_EQUIPMENT_PROFILE_REMOVE_LOWEST,
    },
  });
}

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
  equipmentProfiles: z.array(CharacterEquipmentProfileSchema).min(1).default([createDefaultEquipmentProfile()]),
  activeEquipmentProfileId: z.string().nullable().optional().default(null),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Character = z.infer<typeof CharacterSchema>;

export type CharacterSingleSelectionKey = "race" | "class" | "background" | "flaw";
export type CharacterMultiSelectionKey = "spells" | "features" | "feats" | "expertise" | "gear";
export type CharacterSelectionKey = CharacterSingleSelectionKey | CharacterMultiSelectionKey;

export type CharacterEquipmentStats = Pick<
  CharacterEquipmentProfile,
  "skill" | "agility" | "aim" | "tactics" | "initiative" | "block" | "toughness" | "damage"
>;

export function isWeaponEntry(link: CharacterContentLink | null | undefined): link is CharacterContentLink {
  return Boolean(link && link.categoryId === "items-weapon");
}

export function isArmorEntry(link: CharacterContentLink | null | undefined): link is CharacterContentLink {
  return Boolean(link && link.categoryId === "items-armor");
}

export function getActiveEquipmentProfile(
  character: Pick<Character, "equipmentProfiles" | "activeEquipmentProfileId">,
): CharacterEquipmentProfile {
  const [firstProfile] = character.equipmentProfiles;
  return (
    character.equipmentProfiles.find((profile) => profile.id === character.activeEquipmentProfileId) ??
    firstProfile ??
    createDefaultEquipmentProfile()
  );
}

export function formatEquipmentProfileDamage(damage: CharacterEquipmentProfileDamage): string {
  const keepHighestMarker = damage.removeLowest ? "h" : "";
  const bonus = damage.bonus === 0 ? "" : damage.bonus > 0 ? `+${damage.bonus}` : String(damage.bonus);
  return `${damage.diceCount}${damage.diceSize}${keepHighestMarker}${bonus}`;
}

export function getCharacterEquipmentStats(character: Character): CharacterEquipmentStats {
  const profile = getActiveEquipmentProfile(character);
  return {
    skill: profile.skill,
    agility: profile.agility,
    aim: profile.aim,
    tactics: profile.tactics,
    initiative: profile.initiative,
    block: profile.block,
    toughness: profile.toughness,
    damage: profile.damage,
  };
}
