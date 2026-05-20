import { z } from "zod";
import { MonsterType } from "./type.encounter.js";

export const MonsterTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  monsterType: MonsterType,
  initiative: z.number().int().min(1),
  maxHp: z.number().int().min(1),
  notes: z.string().default(""),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type MonsterTemplate = z.infer<typeof MonsterTemplateSchema>;
