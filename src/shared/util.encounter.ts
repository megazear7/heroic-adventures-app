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

function numberedMonsterName(baseName: string, index: number): string {
  return index === 1 ? baseName : `${baseName} #${index}`;
}

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
