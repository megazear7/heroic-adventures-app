import { INITIATIVE_CARDS } from "./type.encounter.js";

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
