import { Encounter, EncounterSchema } from "./type.encounter.js";
import { getActiveProfileId } from "./service.profile.js";

const ENCOUNTERS_STORAGE_PREFIX = "heroic-encounters";
const LEGACY_STORAGE_KEY = "ha-encounter-tracker";

export const ENCOUNTERS_CHANGED_EVENT = "heroic-encounters-changed";

function storageKey(): string {
  const id = getActiveProfileId();
  return id ? `${ENCOUNTERS_STORAGE_PREFIX}-${id}` : ENCOUNTERS_STORAGE_PREFIX;
}

function dispatchEncountersChanged(): void {
  window.dispatchEvent(new CustomEvent(ENCOUNTERS_CHANGED_EVENT));
}

function saveEncounterList(encounters: Encounter[], shouldDispatch = true): void {
  localStorage.setItem(storageKey(), JSON.stringify(encounters));
  if (shouldDispatch) {
    dispatchEncountersChanged();
  }
}

function compareEncounterSequence(left: Encounter, right: Encounter): number {
  return left.createdAt - right.createdAt || left.id.localeCompare(right.id);
}

function ensureEncounterSequenceNumbers(encounters: Encounter[]): Encounter[] {
  const maxSequenceNumber = encounters.reduce(
    (maxValue, encounter) => Math.max(maxValue, encounter.sequenceNumber ?? 0),
    0,
  );
  const missing = encounters.filter((encounter) => encounter.sequenceNumber == null).sort(compareEncounterSequence);
  if (missing.length === 0) {
    return encounters;
  }

  let nextSequenceNumber = maxSequenceNumber;
  const assignedSequenceNumbers = new Map<string, number>();
  for (const encounter of missing) {
    nextSequenceNumber += 1;
    assignedSequenceNumbers.set(encounter.id, nextSequenceNumber);
  }

  return encounters.map((encounter) =>
    assignedSequenceNumbers.has(encounter.id)
      ? { ...encounter, sequenceNumber: assignedSequenceNumbers.get(encounter.id) }
      : encounter,
  );
}

function nextEncounterSequenceNumber(encounters: Encounter[]): number {
  return encounters.reduce((maxValue, encounter) => Math.max(maxValue, encounter.sequenceNumber ?? 0), 0) + 1;
}

/** Migrate a single legacy encounter from the old single-slot key, if present. Saves to the new key and removes the old one. */
function migrateLegacyEncounterAndSave(encounters: Encounter[]): Encounter[] {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return encounters;
    const parsed = EncounterSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return encounters;
    const legacy = parsed.data;
    // Only migrate if not already present
    if (encounters.some((e) => e.id === legacy.id)) return encounters;
    const migrated = [legacy, ...encounters];
    localStorage.setItem(storageKey(), JSON.stringify(migrated));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return migrated;
  } catch {
    return encounters;
  }
}

export function getEncounters(): Encounter[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) {
      const empty: Encounter[] = [];
      return migrateLegacyEncounterAndSave(empty);
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const encounters = parsed
      .map((item) => EncounterSchema.safeParse(item))
      .filter((result): result is { success: true; data: Encounter } => result.success)
      .map((result) => result.data);
    const normalizedEncounters = ensureEncounterSequenceNumbers(encounters);
    if (normalizedEncounters !== encounters) {
      saveEncounterList(normalizedEncounters, false);
    }
    return normalizedEncounters;
  } catch {
    return [];
  }
}

export function getEncounter(id: string): Encounter | null {
  return getEncounters().find((e) => e.id === id) ?? null;
}

export function upsertEncounter(encounter: Encounter): Encounter {
  const encounters = getEncounters();
  const next = [...encounters];
  const index = next.findIndex((e) => e.id === encounter.id);
  const normalizedEncounter = {
    ...encounter,
    sequenceNumber: next[index]?.sequenceNumber ?? encounter.sequenceNumber ?? nextEncounterSequenceNumber(encounters),
  };
  if (index >= 0) {
    next[index] = normalizedEncounter;
  } else {
    next.unshift(normalizedEncounter);
  }
  saveEncounterList(next);
  return normalizedEncounter;
}

export function deleteEncounter(id: string): void {
  saveEncounterList(getEncounters().filter((e) => e.id !== id));
}

export function duplicateEncounter(encounter: Encounter): Encounter {
  const copy: Encounter = {
    ...encounter,
    id: crypto.randomUUID(),
    name: `${encounter.name} (copy)`,
    sequenceNumber: undefined,
    archived: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return upsertEncounter(copy);
}

export function formatEncounterSequenceNumber(sequenceNumber: number): string {
  return `#${String(sequenceNumber).padStart(3, "0")}`;
}

export function getEncounterSequenceNumber(encounter: Encounter, encounters = getEncounters()): number {
  if (encounter.sequenceNumber != null) {
    return encounter.sequenceNumber;
  }

  const normalizedEncounters = ensureEncounterSequenceNumbers(encounters);
  return normalizedEncounters.find((item) => item.id === encounter.id)?.sequenceNumber ?? nextEncounterSequenceNumber(encounters);
}

export function formatEncounterName(encounter: Encounter, encounters = getEncounters()): string {
  return `${formatEncounterSequenceNumber(getEncounterSequenceNumber(encounter, encounters))} ${encounter.name}`;
}

export function setEncounterArchived(id: string, archived: boolean): Encounter | null {
  const encounters = getEncounters();
  const index = encounters.findIndex((encounter) => encounter.id === id);
  if (index === -1) {
    return null;
  }

  const updatedEncounter = {
    ...encounters[index],
    archived,
    updatedAt: Date.now(),
  };
  encounters[index] = updatedEncounter;
  saveEncounterList(encounters);
  return updatedEncounter;
}
