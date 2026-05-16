// Encounter Tracker types and Zod schemas for validation
import { z } from "zod";

/**
 * The 10 initiative cards used in Heroic Adventures 2nd Edition.
 *
 * 4 player cards (initiative ranges 1–3, 4–6, 7–8, 9+) → major action
 * 4 monster cards (same ranges)                          → major action
 * 1 all-players card                                     → minor or heroic action
 * 1 all-monsters card                                    → minor or heroic action
 */
export interface InitiativeCard {
  id: string;
  label: string;
  participantType: "player" | "monster";
  /** null means "all" (minor/heroic card) */
  minInit: number | null;
  /** null means "all" (minor/heroic card) */
  maxInit: number | null;
  actionType: "major" | "minor";
}

export const INITIATIVE_CARDS: readonly InitiativeCard[] = [
  { id: "player-1-3",      label: "Players 1–3",   participantType: "player",  minInit: 1, maxInit: 3,   actionType: "major" },
  { id: "player-4-6",      label: "Players 4–6",   participantType: "player",  minInit: 4, maxInit: 6,   actionType: "major" },
  { id: "player-7-8",      label: "Players 7–8",   participantType: "player",  minInit: 7, maxInit: 8,   actionType: "major" },
  { id: "player-9plus",    label: "Players 9+",    participantType: "player",  minInit: 9, maxInit: 999, actionType: "major" },
  { id: "monster-1-3",     label: "Monsters 1–3",  participantType: "monster", minInit: 1, maxInit: 3,   actionType: "major" },
  { id: "monster-4-6",     label: "Monsters 4–6",  participantType: "monster", minInit: 4, maxInit: 6,   actionType: "major" },
  { id: "monster-7-8",     label: "Monsters 7–8",  participantType: "monster", minInit: 7, maxInit: 8,   actionType: "major" },
  { id: "monster-9plus",   label: "Monsters 9+",   participantType: "monster", minInit: 9, maxInit: 999, actionType: "major" },
  { id: "players-minor",   label: "All Players",   participantType: "player",  minInit: null, maxInit: null, actionType: "minor" },
  { id: "monsters-minor",  label: "All Monsters",  participantType: "monster", minInit: null, maxInit: null, actionType: "minor" },
] as const;

export const ParticipantType = z.enum(["monster", "player"]);
export type ParticipantType = z.infer<typeof ParticipantType>;

export const ParticipantSchema = z.object({
  id: z.string(),
  characterId: z.string().optional(),
  name: z.string().min(1),
  type: ParticipantType,
  /** Initiative value (1–3, 4–6, 7–8, or 9+) determines which card activates them */
  initiative: z.number().int().min(1),
  pendingInitiative: z.number().int().min(1).nullable().optional().default(null),
  hp: z.number().int(),
  maxHp: z.number().int().min(1),
  notes: z.string(),
  conditions: z.array(z.string()),
});
export type Participant = z.infer<typeof ParticipantSchema>;

export const EncounterSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number().int().min(1).max(30).default(1),
  round: z.number().int().min(1),
  /** Index into deck of the currently revealed card; -1 = round not yet started */
  currentCardIndex: z.number().int().min(-1),
  /** Shuffled ordered list of InitiativeCard ids for the current round */
  deck: z.array(z.string()),
  participants: z.array(ParticipantSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type Encounter = z.infer<typeof EncounterSchema>;
