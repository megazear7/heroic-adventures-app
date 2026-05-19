import { getActiveProfileId } from "./service.profile.js";
import { MonsterTemplate, MonsterTemplateSchema } from "./type.monster-template.js";

const MONSTER_TEMPLATES_STORAGE_PREFIX = "heroic-monster-templates";

export const MONSTER_TEMPLATES_CHANGED_EVENT = "heroic-monster-templates-changed";

function storageKey(): string {
  const id = getActiveProfileId();
  return id ? `${MONSTER_TEMPLATES_STORAGE_PREFIX}-${id}` : MONSTER_TEMPLATES_STORAGE_PREFIX;
}

function dispatchMonsterTemplatesChanged(): void {
  window.dispatchEvent(new CustomEvent(MONSTER_TEMPLATES_CHANGED_EVENT));
}

function saveMonsterTemplates(templates: MonsterTemplate[]): void {
  localStorage.setItem(storageKey(), JSON.stringify(templates));
  dispatchMonsterTemplatesChanged();
}

export function getMonsterTemplates(): MonsterTemplate[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => MonsterTemplateSchema.safeParse(item))
      .filter((result): result is { success: true; data: MonsterTemplate } => result.success)
      .map((result) => result.data);
  } catch {
    return [];
  }
}

export function getMonsterTemplate(templateId: string): MonsterTemplate | null {
  return getMonsterTemplates().find((template) => template.id === templateId) ?? null;
}

export function upsertMonsterTemplate(template: MonsterTemplate): MonsterTemplate {
  const templates = getMonsterTemplates();
  const next = [...templates];
  const index = next.findIndex((item) => item.id === template.id);
  if (index >= 0) {
    next[index] = template;
  } else {
    next.unshift(template);
  }
  saveMonsterTemplates(next);
  return template;
}

export function deleteMonsterTemplate(templateId: string): void {
  saveMonsterTemplates(getMonsterTemplates().filter((template) => template.id !== templateId));
}
