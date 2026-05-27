import { z } from "zod";
import { MonsterType } from "./type.encounter.js";

export const MonsterStatBlock = z.object({
  skill: z.number().int(),
  ag: z.number().int(),
  aim: z.number().int(),
  tac: z.number().int(),
  int: z.number().int(),
  will: z.number().int(),
  str: z.number().int(),
  init: z.number().int(),
  tough: z.number().int(),
  block: z.number().int(),
  damage: z.string().min(1),
  health: z.number().int().min(1),
});
export type MonsterStatBlock = z.infer<typeof MonsterStatBlock>;

export const MonsterStatsLevelRange = z.enum([
  "levels_1_2",
  "levels_3_4",
  "levels_5_6",
  "levels_7_8",
  "levels_9_10",
  "levels_11_12",
  "levels_13_14",
  "levels_15_16",
  "levels_17_18",
  "levels_19_20",
  "levels_21_22",
  "levels_23_24",
  "levels_25_26",
  "levels_27_28",
  "levels_29_30",
]);
export type MonsterStatsLevelRange = z.infer<typeof MonsterStatsLevelRange>;

export const MonsterStatsByType = z.record(MonsterType, MonsterStatBlock);
export type MonsterStatsByType = z.infer<typeof MonsterStatsByType>;

export const MonsterStats = z.record(MonsterStatsLevelRange, MonsterStatsByType);
export type MonsterStats = z.infer<typeof MonsterStats>;