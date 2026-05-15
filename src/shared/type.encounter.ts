// Encounter Tracker types and Zod schemas for validation
import { z } from "zod";

export const ParticipantType = z.enum(["monster", "player"]);
export type ParticipantType = z.infer<typeof ParticipantType>;

export const ParticipantSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: ParticipantType,
  initiative: z.number().int(),
  hp: z.number().int(),
  maxHp: z.number().int().min(1),
  notes: z.string(),
  conditions: z.array(z.string()),
});
export type Participant = z.infer<typeof ParticipantSchema>;

export const EncounterSchema = z.object({
  id: z.string(),
  name: z.string(),
  round: z.number().int().min(1),
  currentTurnIndex: z.number().int().min(0),
  participants: z.array(ParticipantSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type Encounter = z.infer<typeof EncounterSchema>;
