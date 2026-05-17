// Encounter Tracker types and Zod schemas for validation
import { z } from "zod";

/**
 * The 10 initiative cards used in Heroic Adventures 2nd Edition.
 *
 * 4 player cards (initiative ranges vary by encounter level) → major action
 * 4 monster cards (same ranges)                             → major action
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

type InitiativeRange = readonly [minInit: number, maxInit: number | null];
type InitiativeRangeSet = readonly [InitiativeRange, InitiativeRange, InitiativeRange, InitiativeRange];

type MajorInitiativeCardDefinition = {
  id: string;
  participantType: InitiativeCard["participantType"];
  actionType: "major";
  tierIndex: number;
};

type MinorInitiativeCardDefinition = {
  id: string;
  participantType: InitiativeCard["participantType"];
  actionType: "minor";
};

type InitiativeCardDefinition = MajorInitiativeCardDefinition | MinorInitiativeCardDefinition;
const UNBOUNDED_INITIATIVE_MAX = 999;
const initiativeCardsByLevel = new Map<number, readonly InitiativeCard[]>();

const INITIATIVE_CARD_DEFINITIONS: readonly InitiativeCardDefinition[] = [
  { id: "player-1-3", participantType: "player", actionType: "major", tierIndex: 0 },
  { id: "player-4-6", participantType: "player", actionType: "major", tierIndex: 1 },
  { id: "player-7-8", participantType: "player", actionType: "major", tierIndex: 2 },
  { id: "player-9plus", participantType: "player", actionType: "major", tierIndex: 3 },
  { id: "monster-1-3", participantType: "monster", actionType: "major", tierIndex: 0 },
  { id: "monster-4-6", participantType: "monster", actionType: "major", tierIndex: 1 },
  { id: "monster-7-8", participantType: "monster", actionType: "major", tierIndex: 2 },
  { id: "monster-9plus", participantType: "monster", actionType: "major", tierIndex: 3 },
  { id: "players-minor", participantType: "player", actionType: "minor" },
  { id: "monsters-minor", participantType: "monster", actionType: "minor" },
] as const;

const LEVEL_INITIATIVE_RANGES: readonly InitiativeRangeSet[] = [
  [
    [1, 2],
    [3, 4],
    [5, 7],
    [8, null],
  ],
  [
    [1, 3],
    [4, 6],
    [7, 9],
    [10, null],
  ],
  [
    [1, 4],
    [5, 8],
    [9, 11],
    [12, null],
  ],
  [
    [1, 5],
    [6, 10],
    [11, 13],
    [14, null],
  ],
  [
    [1, 6],
    [7, 12],
    [13, 15],
    [16, null],
  ],
] as const;

function normalizeEncounterLevel(level: number): number {
  if (!Number.isFinite(level)) return 1;
  return Math.max(1, Math.floor(level));
}

function getLevelRangeIndex(level: number): number {
  const normalizedLevel = normalizeEncounterLevel(level);
  if (normalizedLevel <= 4) return 0;
  if (normalizedLevel <= 8) return 1;
  if (normalizedLevel <= 12) return 2;
  if (normalizedLevel <= 16) return 3;
  return 4;
}

function getInitiativeRangesForLevel(level: number): InitiativeRangeSet {
  return LEVEL_INITIATIVE_RANGES[getLevelRangeIndex(level)];
}

function buildCardLabel(
  participantType: InitiativeCard["participantType"],
  minInit: number,
  maxInit: number | null,
): string {
  const participantLabel = participantType === "player" ? "Players" : "Monsters";
  return maxInit === null ? `${participantLabel} ${minInit}+` : `${participantLabel} ${minInit}–${maxInit}`;
}

function buildInitiativeCard(definition: InitiativeCardDefinition, level: number): InitiativeCard {
  if (definition.actionType === "minor") {
    return {
      id: definition.id,
      label: definition.participantType === "player" ? "All Players" : "All Monsters",
      participantType: definition.participantType,
      minInit: null,
      maxInit: null,
      actionType: "minor",
    };
  }

  const [minInit, maxInitValue] = getInitiativeRangesForLevel(level)[definition.tierIndex];
  const maxInit = maxInitValue ?? UNBOUNDED_INITIATIVE_MAX;

  return {
    id: definition.id,
    label: buildCardLabel(definition.participantType, minInit, maxInitValue),
    participantType: definition.participantType,
    minInit,
    maxInit,
    actionType: "major",
  };
}

export const INITIATIVE_CARDS: readonly InitiativeCard[] = INITIATIVE_CARD_DEFINITIONS.map((definition) =>
  buildInitiativeCard(definition, 1),
);

export function getInitiativeCards(level: number): readonly InitiativeCard[] {
  const normalizedLevel = normalizeEncounterLevel(level);
  const cachedCards = initiativeCardsByLevel.get(normalizedLevel);
  if (cachedCards) return cachedCards;

  const cards = INITIATIVE_CARD_DEFINITIONS.map((definition) => buildInitiativeCard(definition, normalizedLevel));
  initiativeCardsByLevel.set(normalizedLevel, cards);
  return cards;
}

export function getInitiativeCardById(id: string, level: number): InitiativeCard | undefined {
  return getInitiativeCards(level).find((card) => card.id === id);
}

export const ParticipantType = z.enum(["monster", "player"]);
export type ParticipantType = z.infer<typeof ParticipantType>;

export const ParticipantSchema = z.object({
  id: z.string(),
  characterId: z.string().optional(),
  name: z.string().min(1),
  type: ParticipantType,
  /** Initiative value determines which major-action card activates them for the encounter level */
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
  archived: z.boolean().optional(),
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
