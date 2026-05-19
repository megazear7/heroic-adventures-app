import { INITIATIVE_CARDS, Participant } from "./type.encounter.js";
import { MonsterTemplate } from "./type.monster-template.js";

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

/** Builds a display name for a templated monster based on its 1-based index in the encounter. */
function numberedMonsterName(baseName: string, index: number): string {
  return index === 1 ? baseName : `${baseName} #${index}`;
}

/** Removes an auto-numbering suffix (for example, "Goblin #2" → "Goblin"). */
export function stripMonsterCounter(name: string): string {
  return name.replace(/\s+#\d+$/, "").trim();
}

/**
 * Re-applies deterministic names for all participants tied to a template.
 * The first participant keeps the plain template name and subsequent entries get #N suffixes.
 */
export function syncTemplateMonsterNames(
  participants: Participant[],
  templateId: string,
  templateName: string,
): Participant[] {
  let templateCount = 0;
  return participants.map((participant) => {
    if (participant.monsterTemplateId !== templateId) {
      return participant;
    }
    templateCount += 1;
    return {
      ...participant,
      name: numberedMonsterName(templateName, templateCount),
    };
  });
}

/**
 * Creates a monster participant from a template with automatic sequential naming.
 * Example: first "Goblin", second "Goblin #2", third "Goblin #3".
 */
export function buildMonsterParticipantFromTemplate(template: MonsterTemplate, currentParticipants: Participant[]): Participant {
  const existingCount = currentParticipants.filter((participant) => participant.monsterTemplateId === template.id).length;
  const name = numberedMonsterName(template.name, existingCount + 1);
  return {
    id: crypto.randomUUID(),
    monsterTemplateId: template.id,
    name,
    type: "monster",
    monsterType: template.monsterType,
    initiative: template.initiative,
    pendingInitiative: null,
    hp: template.maxHp,
    maxHp: template.maxHp,
    notes: template.notes,
    conditions: [],
  };
}
