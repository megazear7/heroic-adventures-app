// Character types and Zod schemas for validation
import { z } from 'zod';

export const CharacterRace = z.string();
export const CharacterClass = z.string();
export const CharacterBackground = z.string();
export const CharacterFlaw = z.string();
export const CharacterSpell = z.string();
export const CharacterFeature = z.string();
export const CharacterFeat = z.string();
export const CharacterExpertise = z.string();

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  race: CharacterRace,
  class: CharacterClass,
  background: CharacterBackground,
  flaw: CharacterFlaw,
  spells: z.array(CharacterSpell),
  features: z.array(CharacterFeature),
  feats: z.array(CharacterFeat),
  expertise: z.array(CharacterExpertise),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Character = z.infer<typeof CharacterSchema>;
