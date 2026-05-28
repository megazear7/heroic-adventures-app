import {
  buildMonsterParticipantFromTemplate,
  normalizeDuplicateParticipantNames,
  resolveParticipantDamage,
  syncTemplateMonsterNames,
} from "../src/shared/util.encounter.js";
import { Participant } from "../src/shared/type.encounter.js";
import { MonsterTemplate } from "../src/shared/type.monster-template.js";

function assertEqual(actual: unknown, expected: unknown, message: string): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${message}\nExpected: ${expectedJson}\nActual: ${actualJson}`);
  }
}

function monster(id: string, name: string): Participant {
  return {
    id,
    name,
    type: "monster",
    monsterType: "minion",
    initiative: 2,
    pendingInitiative: null,
    hp: 6,
    maxHp: 6,
    toughness: 0,
    toughnessEnabled: true,
    notes: "",
    conditions: [],
  };
}

function names(participants: Participant[]): string[] {
  return participants.map((participant) => participant.name);
}

function testManualNames(): void {
  const participants = normalizeDuplicateParticipantNames([
    monster("1", "Goblin"),
    monster("2", "goblin"),
    monster("3", "Goblin"),
    monster("4", "Orc"),
  ]);

  assertEqual(names(participants), ["Goblin #1", "goblin #2", "Goblin #3", "Orc"], "manual names should renumber case-insensitively");
}

function testRenumberAfterRemoval(): void {
  const participants = normalizeDuplicateParticipantNames([monster("1", "Goblin #2")]);
  assertEqual(names(participants), ["Goblin"], "single remaining participant should lose the counter");
}

function testTemplateAdds(): void {
  const template: MonsterTemplate = {
    id: "tmpl-1",
    name: "Skeleton",
    monsterType: "soldier",
    initiative: 4,
    maxHp: 12,
    notes: "",
    createdAt: 0,
    updatedAt: 0,
  };

  const first = buildMonsterParticipantFromTemplate(template, [], 1);
  const second = buildMonsterParticipantFromTemplate(template, [first], 1);
  const participants = syncTemplateMonsterNames([first, second], template.id, template.name);

  assertEqual(names(participants), ["Skeleton #1", "Skeleton #2"], "template adds should number both original and duplicate");
  assertEqual(first.toughness, 2, "template adds should inherit toughness from encounter-level monster stats");
}

function testMixedExistingCounterNames(): void {
  const participants = normalizeDuplicateParticipantNames([
    monster("1", "Bandit #4"),
    monster("2", "bandit"),
    monster("3", "Bandit #8"),
  ]);

  assertEqual(names(participants), ["Bandit #1", "bandit #2", "Bandit #3"], "existing counters should be normalized from encounter order");
}

function testToughnessDamage(): void {
  const participant = { ...monster("1", "Ogre"), toughness: 3, toughnessEnabled: true };

  assertEqual(resolveParticipantDamage(participant, 2), 0, "toughness should prevent low damage");
  assertEqual(resolveParticipantDamage(participant, 7), 4, "toughness should reduce incoming damage when enabled");
  assertEqual(
    resolveParticipantDamage({ ...participant, toughnessEnabled: false }, 7),
    7,
    "disabled toughness should not reduce damage",
  );
}

function main(): void {
  testManualNames();
  testRenumberAfterRemoval();
  testTemplateAdds();
  testMixedExistingCounterNames();
  testToughnessDamage();
  console.log("encounter participant naming tests passed");
}

main();