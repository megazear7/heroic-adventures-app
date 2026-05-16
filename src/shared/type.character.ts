import { z } from "zod";

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

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  health: z.number().int().min(1).default(10),
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
