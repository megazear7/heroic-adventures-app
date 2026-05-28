import { INITIATIVE_CARDS, Participant } from "./type.encounter.js";
import { MonsterTemplate } from "./type.monster-template.js";
import { getMonsterStatsForEncounterLevel } from "./util.monster-stats.js";

export function shuffleIds(ids: string[]): string[] {
  const shuffled = [...ids];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function shuffleDeck(): string[] {
  return shuffleIds(INITIATIVE_CARDS.map((c) => c.id));
}

export function resolveParticipantDamage(participant: Participant, incomingDamage: number): number {
  const damage = Math.max(0, Math.floor(incomingDamage));
  if (!participant.toughnessEnabled) {
    return damage;
  }
  return Math.max(0, damage - participant.toughness);
}

/** Removes an auto-numbering suffix (for example, "Goblin #2" → "Goblin"). */
export function stripMonsterCounter(name: string): string {
  return name.replace(/\s+#\d+$/, "").trim();
}

function participantNameKey(name: string): string {
  return stripMonsterCounter(name).toLocaleLowerCase();
}

/**
 * Re-applies deterministic numbering for participants with matching names.
 * Matching is case-insensitive and ignores an existing trailing "#N" suffix.
 */
export function normalizeDuplicateParticipantNames(participants: Participant[]): Participant[] {
  const counts = new Map<string, number>();

  for (const participant of participants) {
    const key = participantNameKey(participant.name);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const seen = new Map<string, number>();

  return participants.map((participant) => {
    const baseName = stripMonsterCounter(participant.name);
    const key = participantNameKey(baseName);
    const total = counts.get(key) ?? 0;

    if (total <= 1) {
      return baseName === participant.name ? participant : { ...participant, name: baseName };
    }

    const index = (seen.get(key) ?? 0) + 1;
    seen.set(key, index);
    const name = `${baseName} #${index}`;
    return name === participant.name ? participant : { ...participant, name };
  });
}

/**
 * Re-applies template base names, then renumbers any duplicates across the encounter.
 */
export function syncTemplateMonsterNames(
  participants: Participant[],
  templateId: string,
  templateName: string,
): Participant[] {
  const syncedParticipants = participants.map((participant) => {
    if (participant.monsterTemplateId !== templateId) {
      return participant;
    }
    return {
      ...participant,
      name: templateName,
    };
  });

  return normalizeDuplicateParticipantNames(syncedParticipants);
}

/**
 * Creates a monster participant from a template. Name numbering is applied when the
 * participant list is normalized.
 */
export function buildMonsterParticipantFromTemplate(
  template: MonsterTemplate,
  _currentParticipants: Participant[],
  encounterLevel: number,
): Participant {
  const stats = getMonsterStatsForEncounterLevel(encounterLevel, template.monsterType);
  return {
    id: crypto.randomUUID(),
    monsterTemplateId: template.id,
    name: template.name,
    type: "monster",
    monsterType: template.monsterType,
    initiative: template.initiative,
    pendingInitiative: null,
    hp: template.maxHp,
    maxHp: template.maxHp,
    toughness: stats.tough,
    toughnessEnabled: true,
    notes: template.notes,
    conditions: [],
  };
}
