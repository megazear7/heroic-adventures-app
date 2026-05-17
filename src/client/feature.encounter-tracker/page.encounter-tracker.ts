import { LitElement, html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { CHARACTERS_CHANGED_EVENT, getCharacters, upsertCharacter } from "../../shared/service.characters.js";
import { Character } from "../../shared/type.character.js";
import {
  Encounter,
  EncounterSchema,
  Participant,
  INITIATIVE_CARDS,
  InitiativeCard,
  getInitiativeCardById,
} from "../../shared/type.encounter.js";
import { PROFILE_CHANGED_EVENT } from "../../shared/service.profile.js";
import { searchIcon } from "../icons.js";
import "./component.encounter-add-form.js";
import "./component.encounter-participant.js";

const STORAGE_KEY = "ha-encounter-tracker";
const DECK_SIZE = INITIATIVE_CARDS.length; // 10
const MAX_ROSTER_SEARCH_RESULTS = 8;
function shuffleDeck(): string[] {
  return shuffleIds(INITIATIVE_CARDS.map((c) => c.id));
}

function shuffleIds(ids: string[]): string[] {
  const shuffled = [...ids];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function buildRosterSearchText(character: Character): string {
  return `${character.name} ${character.race.title} ${character.class.title}`.toLowerCase();
}

function rosterSearchScore(query: string, character: Character): number {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return 1;
  const haystack = buildRosterSearchText(character);
  const name = character.name.toLowerCase();
  if (haystack === normalized) return 200;
  if (name === normalized) return 160;
  if (name.startsWith(normalized)) return 140;
  if (haystack.startsWith(normalized)) return 120;
  if (haystack.includes(normalized)) return 90;
  return 0;
}

function compareRosterCharacters(left: Character, right: Character): number {
  return left.name.localeCompare(right.name) || left.class.title.localeCompare(right.class.title);
}

function sortRosterByScore(query: string, characters: Character[]): Character[] {
  return [...characters]
    .map((character) => ({ character, score: rosterSearchScore(query, character) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || compareRosterCharacters(left.character, right.character))
    .map((item) => item.character);
}

function newEncounter(): Encounter {
  return {
    id: crypto.randomUUID(),
    name: "New Encounter",
    level: 1,
    round: 1,
    currentCardIndex: -1,
    deck: shuffleDeck(),
    participants: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function cardById(id: string, level: number): InitiativeCard | undefined {
  return getInitiativeCardById(id, level);
}

function cardActionTypeLabel(actionType: InitiativeCard["actionType"]): string {
  return actionType === "minor" ? "Minor/Heroic action" : "Major action";
}

function participantsForCard(participants: Participant[], card: InitiativeCard): Participant[] {
  return participants.filter((p) => {
    if (p.type !== card.participantType) return false;
    if (card.minInit === null) return true;
    return p.initiative >= card.minInit && p.initiative <= (card.maxInit as number);
  });
}

/**
 * Determines the effective action type for the currently drawn card.
 *
 * Rules (Heroic Adventures 2e):
 * - Minor/heroic card → always "minor"
 * - First card drawn, OR current tier > previous tier → "bonus" (Bonus Action)
 * - Current tier ≤ previous tier, OR previous was minor/heroic → "major"
 */
function computeActionType(enc: Encounter): "bonus" | "major" | "minor" {
  const cardIndex = enc.currentCardIndex;
  if (cardIndex < 0) return "major";

  const card = cardById(enc.deck[cardIndex], enc.level);
  if (!card) return "major";

  // Minor/heroic card → stays minor regardless
  if (card.actionType === "minor") return "minor";

  // First card of the round → bonus action
  if (cardIndex === 0) return "bonus";

  // Check the previous card
  const prevCard = cardById(enc.deck[cardIndex - 1], enc.level);
  if (!prevCard) return "major";

  // Previous card was a minor/heroic card → major action only
  if (prevCard.actionType === "minor") return "major";

  // Compare initiative tiers: ascending (current > previous) → bonus action
  // At this point both cards are "major" actionType, so minInit is guaranteed non-null
  if (card.minInit === null || prevCard.minInit === null) return "major";
  return card.minInit > prevCard.minInit ? "bonus" : "major";
}

@customElement("page-encounter-tracker")
export class PageEncounterTracker extends LitElement {
  static override styles = css`
    :host {
      display: block;
      padding: 1.5rem 1rem;
      min-height: 100vh;
      background: var(--color-primary-surface, #0f0f1a);
    }
    h1 {
      font-family: var(--font-family-display, serif);
      font-size: 1.75rem;
      color: var(--color-1, #c9a84c);
      margin: 0 0 0.25rem;
    }
    .subtitle {
      font-size: 0.875rem;
      color: var(--color-primary-text-muted, #8a8780);
      margin: 0 0 1.5rem;
    }
    .encounter-header {
      display: flex;
      align-items: flex-end;
      gap: 1rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .encounter-name-input {
      flex: 1;
      min-width: 160px;
      font-size: 1rem;
      font-weight: 600;
      font-family: var(--font-family, sans-serif);
      padding: 0.4rem 0.75rem;
      border-radius: 8px;
      border: 1px solid rgba(201, 168, 76, 0.25);
      background: var(--color-primary-surface-raised, #16162a);
      color: var(--color-primary-text, #e2e0d6);
      outline: none;
    }
    .encounter-name-input:focus {
      border-color: var(--color-1, #c9a84c);
    }
    .round-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--color-primary-surface-raised, #16162a);
      border: 1px solid rgba(201, 168, 76, 0.2);
      border-radius: 8px;
      padding: 0.4rem 0.9rem;
      font-size: 0.85rem;
      color: var(--color-primary-text-muted, #8a8780);
      white-space: nowrap;
    }
    .round-number {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-1, #c9a84c);
    }
    .level-input-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: var(--color-primary-text-muted, #8a8780);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .level-select {
      font-size: 1rem;
      font-weight: 600;
      font-family: var(--font-family, sans-serif);
      padding: 0.4rem 0.75rem;
      border-radius: 8px;
      border: 1px solid rgba(201, 168, 76, 0.25);
      background: var(--color-primary-surface-raised, #16162a);
      color: var(--color-primary-text, #e2e0d6);
      outline: none;
    }
    .level-select:focus {
      border-color: var(--color-1, #c9a84c);
    }

    /* ---- Card Deck ---- */
    .deck-section {
      background: var(--color-primary-surface-raised, #16162a);
      border: 1px solid rgba(201, 168, 76, 0.15);
      border-radius: 14px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .deck-section-title {
      font-size: 0.82rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-primary-text-muted, #8a8780);
      margin: 0 0 0.875rem;
    }
    .current-card {
      border-radius: 10px;
      height: 90px;
      box-sizing: border-box;
      padding: 1rem 1.25rem;
      margin-bottom: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .current-card.player {
      background: rgba(100, 180, 255, 0.08);
      border: 2px solid rgba(100, 180, 255, 0.35);
    }
    .current-card.monster {
      background: rgba(255, 100, 100, 0.08);
      border: 2px solid rgba(255, 100, 100, 0.35);
    }
    .current-card.none {
      background: var(--color-primary-surface-overlay, #1e1e38);
      border: 2px dashed rgba(201, 168, 76, 0.2);
    }
    .card-label {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--color-primary-text, #e2e0d6);
    }
    .card-action-type {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--color-primary-text-muted, #8a8780);
    }
    .card-action-type.major {
      color: var(--color-1, #c9a84c);
    }
    .card-action-type.bonus {
      color: #a8e6a0;
    }
    .card-action-type.minor {
      color: #88ccff;
    }
    .card-active-names {
      font-size: 0.88rem;
      color: var(--color-primary-text, #e2e0d6);
      margin-top: 0.25rem;
    }
    .card-active-names strong {
      color: var(--color-1, #c9a84c);
    }
    .card-no-match {
      font-size: 0.82rem;
      color: var(--color-primary-text-muted, #8a8780);
      font-style: italic;
    }
    .deck-progress {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      font-size: 0.82rem;
      color: var(--color-primary-text-muted, #8a8780);
    }
    .deck-pips {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      overflow: visible;
    }
    .deck-pip {
      position: relative;
      width: 10px;
      height: 10px;
      border-radius: 2px;
      border: 1px solid rgba(201, 168, 76, 0.2);
      background: var(--color-primary-surface-overlay, #1e1e38);
      cursor: default;
    }
    .deck-pip.played {
      background: rgba(201, 168, 76, 0.35);
      border-color: var(--color-1, #c9a84c);
    }
    .deck-pip.current {
      background: var(--color-1, #c9a84c);
      border-color: var(--color-1, #c9a84c);
    }
    .deck-pip.player-card {
      border-color: rgba(100, 180, 255, 0.5);
    }
    .deck-pip.player-card.played,
    .deck-pip.player-card.current {
      background: rgba(100, 180, 255, 0.5);
    }
    .deck-pip.monster-card {
      border-color: rgba(255, 100, 100, 0.5);
    }
    .deck-pip.monster-card.played,
    .deck-pip.monster-card.current {
      background: rgba(255, 100, 100, 0.5);
    }
    .deck-pip-tooltip {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      min-width: 150px;
      max-width: 220px;
      background: var(--color-primary-surface-raised, #16162a);
      border: 1px solid rgba(201, 168, 76, 0.3);
      border-radius: 8px;
      padding: 0.5rem 0.6rem;
      font-size: 0.75rem;
      line-height: 1.35;
      color: var(--color-primary-text, #e2e0d6);
      box-shadow: var(--shadow-active, 0 8px 20px rgba(0, 0, 0, 0.35));
      opacity: 0;
      pointer-events: none;
      transition: opacity 80ms ease;
      z-index: 50;
    }
    .deck-pip:hover .deck-pip-tooltip {
      opacity: 1;
    }
    .deck-pip-tooltip-meta {
      margin-top: 0.15rem;
      color: var(--color-primary-text-muted, #8a8780);
      font-size: 0.7rem;
    }

    /* ---- Controls ---- */
    .controls-bar {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0.55rem 1.1rem;
      border-radius: 8px;
      border: 1px solid var(--color-1, #c9a84c);
      background: transparent;
      color: var(--color-1, #c9a84c);
      font-family: var(--font-family, sans-serif);
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition:
        background 150ms ease,
        color 150ms ease;
      min-height: 44px;
      touch-action: manipulation;
    }
    .btn:hover {
      background: var(--color-1, #c9a84c);
      color: #1a1a2e;
    }
    .btn:disabled {
      opacity: 0.4;
      cursor: default;
      pointer-events: none;
    }
    .btn-primary {
      background: var(--color-1, #c9a84c);
      color: #1a1a2e;
    }
    .btn-primary:hover {
      background: #d4b555;
      border-color: #d4b555;
    }
    .btn-end-round {
      background: rgba(100, 180, 255, 0.12);
      color: #88ccff;
      border-color: rgba(100, 180, 255, 0.4);
    }
    .btn-end-round:hover {
      background: rgba(100, 180, 255, 0.25);
      color: #88ccff;
    }
    .btn-danger {
      border-color: rgba(255, 100, 100, 0.5);
      color: #ff8888;
    }
    .btn-danger:hover {
      background: rgba(255, 100, 100, 0.15);
      color: #ff8888;
    }
    .btn-muted {
      border-color: rgba(138, 135, 128, 0.3);
      color: var(--color-primary-text-muted, #8a8780);
    }
    .btn-muted:hover {
      background: rgba(138, 135, 128, 0.1);
      color: var(--color-primary-text, #e2e0d6);
    }

    /* ---- Participants ---- */
    .participants-list {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      margin-bottom: 2rem;
    }
    .empty-state {
      text-align: center;
      padding: 2rem 1rem;
      color: var(--color-primary-text-muted, #8a8780);
      font-size: 0.9rem;
    }
    .section-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-primary-text-muted, #8a8780);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 2rem 0 0.75rem;
    }
    .character-roster {
      margin-bottom: 1.5rem;
      max-width: 560px;
    }
    .roster-field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .roster-helper {
      color: var(--color-primary-text-muted, #8a8780);
      font-size: 0.76rem;
    }
    .roster-search-shell {
      position: relative;
    }
    .roster-search-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--color-primary-surface-raised, #16162a);
      border: 1px solid rgba(201, 168, 76, 0.2);
      border-radius: 10px;
      padding: 10px 14px;
      transition: border-color 120ms ease;
    }
    .roster-search-wrapper:focus-within {
      border-color: var(--color-1, #c9a84c);
      box-shadow: var(--shadow-glow);
    }
    .roster-search-icon {
      color: var(--color-primary-text-muted, #8a8780);
      display: flex;
      flex-shrink: 0;
    }
    .roster-search-input {
      width: 100%;
      background: none;
      border: none;
      outline: none;
      color: var(--color-primary-text, #e2e0d6);
      font-size: 0.95rem;
      font-family: var(--font-family, sans-serif);
    }
    .roster-results {
      position: absolute;
      inset: calc(100% + 6px) 0 auto;
      z-index: 30;
      background: var(--color-primary-surface-raised, #16162a);
      border: 1px solid rgba(201, 168, 76, 0.2);
      border-radius: 10px;
      box-shadow: var(--shadow-active, 0 8px 20px rgba(0, 0, 0, 0.35));
      max-height: min(300px, 45vh);
      overflow: auto;
    }
    .roster-result {
      display: block;
      width: 100%;
      text-align: left;
      border: none;
      border-bottom: 1px solid rgba(201, 168, 76, 0.08);
      background: transparent;
      color: inherit;
      cursor: pointer;
      padding: 0.75rem 0.9rem;
      font: inherit;
    }
    .roster-result:last-child {
      border-bottom: none;
    }
    .roster-result.active,
    .roster-result:hover {
      background: rgba(201, 168, 76, 0.08);
    }
    .roster-item {
      display: grid;
      gap: 0.25rem;
    }
    .roster-item-top {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .roster-name {
      font-weight: 700;
      color: var(--color-primary-text, #e2e0d6);
    }
    .roster-meta {
      color: var(--color-primary-text-muted, #8a8780);
      font-size: 0.82rem;
    }

    /* ---- Toast ---- */
    .toast {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--color-1, #c9a84c);
      color: #1a1a2e;
      font-weight: 700;
      font-size: 0.9rem;
      padding: 0.6rem 1.5rem;
      border-radius: 24px;
      z-index: 9999;
      pointer-events: none;
      animation: toastIn 200ms ease;
    }
    @keyframes toastIn {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
    @media (max-width: 600px) {
      :host {
        padding: 0.75rem 0.5rem;
      }
      h1 {
        font-size: 1.4rem;
      }
      .controls-bar {
        gap: 0.5rem;
      }
      .deck-section {
        padding: 0.875rem;
        border-radius: 10px;
      }
    }
  `;

  @state() private encounter: Encounter = newEncounter();
  @state() private rosterCharacters: Character[] = [];
  @state() private toast: string | null = null;
  @state() private rosterQuery = "";
  @state() private rosterPickerOpen = false;
  @state() private rosterActiveIndex = -1;

  override connectedCallback() {
    super.connectedCallback();
    this.loadEncounter();
    this.syncCharacters();
    window.addEventListener(CHARACTERS_CHANGED_EVENT, this.syncCharacters);
    window.addEventListener(PROFILE_CHANGED_EVENT, this.syncCharacters);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener(CHARACTERS_CHANGED_EVENT, this.syncCharacters);
    window.removeEventListener(PROFILE_CHANGED_EVENT, this.syncCharacters);
  }

  private readonly syncCharacters = (): void => {
    this.rosterCharacters = getCharacters();
    this.syncParticipantsFromRoster();
  };

  private syncParticipantsFromRoster(): void {
    if (this.rosterCharacters.length === 0 || this.encounter.participants.length === 0) {
      return;
    }

    const byId = new Map(this.rosterCharacters.map((character) => [character.id, character]));
    let changed = false;
    const participants = this.encounter.participants.map((participant) => {
      if (!participant.characterId) {
        return participant;
      }

      const character = byId.get(participant.characterId);
      if (!character) {
        return participant;
      }

      const hasPendingInitiative = participant.pendingInitiative !== null;
      const nextParticipant: Participant = {
        ...participant,
        name: character.name,
        hp: character.health,
        maxHp: character.health,
        initiative: hasPendingInitiative ? participant.initiative : character.initiative,
      };

      if (
        nextParticipant.name !== participant.name ||
        nextParticipant.hp !== participant.hp ||
        nextParticipant.maxHp !== participant.maxHp ||
        nextParticipant.initiative !== participant.initiative
      ) {
        changed = true;
      }

      return nextParticipant;
    });

    if (changed) {
      this.encounter = { ...this.encounter, participants };
      this.saveEncounter();
    }
  }

  private get rosterResults(): Character[] {
    return sortRosterByScore(this.rosterQuery, this.rosterCharacters).slice(0, MAX_ROSTER_SEARCH_RESULTS);
  }

  private loadEncounter() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = EncounterSchema.safeParse(JSON.parse(raw));
        if (parsed.success) {
          this.encounter = parsed.data;
          return;
        }
      }
    } catch {
      /* ignore */
    }
    this.encounter = newEncounter();
  }

  private saveEncounter() {
    this.encounter = { ...this.encounter, updatedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.encounter));
  }

  private showToast(msg: string) {
    this.toast = msg;
  }

  private currentCard(): InitiativeCard | null {
    const enc = this.encounter;
    if (enc.currentCardIndex < 0 || enc.currentCardIndex >= enc.deck.length) return null;
    return cardById(enc.deck[enc.currentCardIndex], enc.level) ?? null;
  }

  /* ---- Encounter controls ---- */

  private handleNameChange(e: Event) {
    this.encounter = { ...this.encounter, name: (e.target as HTMLInputElement).value };
    this.saveEncounter();
  }

  private handleLevelChange(e: Event) {
    const level = parseInt((e.target as HTMLSelectElement).value, 10);
    this.encounter = { ...this.encounter, level: Number.isNaN(level) ? 1 : level };
    this.saveEncounter();
  }

  private drawNextCard() {
    const enc = this.encounter;
    const nextIdx = enc.currentCardIndex + 1;
    if (nextIdx >= DECK_SIZE) {
      // All 10 cards played — start a new round
      this.startNewRound();
      return;
    }
    const updatedEnc = { ...enc, currentCardIndex: nextIdx };
    this.encounter = updatedEnc;
    this.saveEncounter();
    const card = cardById(enc.deck[nextIdx], enc.level);
    if (card) {
      const actionType = computeActionType(updatedEnc);
      const action =
        actionType === "bonus" ? "Bonus Action" : actionType === "minor" ? "Minor or Heroic Action" : "Major Action";
      this.showToast(`${card.label} — ${action}`);
    }
  }

  private startNewRound() {
    const newRound = this.encounter.round + 1;
    const participants = this.encounter.participants.map((participant) =>
      participant.pendingInitiative !== null
        ? { ...participant, initiative: participant.pendingInitiative, pendingInitiative: null }
        : participant,
    );
    this.encounter = {
      ...this.encounter,
      round: newRound,
      currentCardIndex: -1,
      deck: shuffleDeck(),
      participants,
    };
    this.saveEncounter();
    this.showToast(`Round ${newRound} — Deck reshuffled!`);
  }

  private shuffleRemainingCards = (): void => {
    const { currentCardIndex, deck } = this.encounter;

    if (currentCardIndex < 0) {
      this.encounter = {
        ...this.encounter,
        deck: shuffleDeck(),
      };
      this.saveEncounter();
      this.showToast("Deck shuffled.");
      return;
    }

    const remaining = deck.slice(currentCardIndex + 1);
    if (remaining.length === 0) {
      this.showToast("No remaining cards to shuffle.");
      return;
    }

    this.encounter = {
      ...this.encounter,
      deck: [...deck.slice(0, currentCardIndex + 1), ...shuffleIds(remaining)],
    };
    this.saveEncounter();
    this.showToast(`Shuffled ${remaining.length} remaining card${remaining.length === 1 ? "" : "s"}.`);
  };

  private resetEncounter() {
    if (!confirm("Start a new encounter? This will clear all participants and reset to Round 1.")) return;
    this.encounter = newEncounter();
    this.saveEncounter();
  }

  /* ---- Participant handlers ---- */

  private handleParticipantAdded(e: CustomEvent<Participant>) {
    const updated = [
      ...this.encounter.participants,
      { ...e.detail, pendingInitiative: e.detail.pendingInitiative ?? null },
    ];
    this.encounter = { ...this.encounter, participants: updated };
    this.saveEncounter();
  }

  private handleAddCharacter(character: Character) {
    const alreadyAdded = this.encounter.participants.some((participant) => participant.characterId === character.id);
    if (alreadyAdded) {
      this.showToast(`${character.name} is already in this encounter.`);
      return;
    }

    const participant: Participant = {
      id: crypto.randomUUID(),
      characterId: character.id,
      name: character.name,
      type: "player",
      initiative: character.initiative,
      pendingInitiative: null,
      hp: character.health,
      maxHp: character.health,
      notes: "",
      conditions: [],
    };

    this.encounter = {
      ...this.encounter,
      participants: [...this.encounter.participants, participant],
    };
    this.saveEncounter();
    this.showToast(`${character.name} added to encounter.`);
    this.rosterQuery = "";
    this.rosterPickerOpen = false;
    this.rosterActiveIndex = -1;
  }

  private handleRosterInput = (event: Event): void => {
    this.rosterQuery = (event.target as HTMLInputElement).value;
    this.rosterPickerOpen = true;
    this.rosterActiveIndex = -1;
  };

  private handleRosterFocus = (): void => {
    this.rosterPickerOpen = true;
  };

  private handleRosterBlur = (event: FocusEvent): void => {
    const shell = this.renderRoot.querySelector(".roster-search-shell");
    const nextTarget = event.relatedTarget as Node | null;
    if (shell && nextTarget && shell.contains(nextTarget)) {
      return;
    }
    this.rosterPickerOpen = false;
    this.rosterActiveIndex = -1;
  };

  private addCharacterFromResult = (character: Character): void => {
    this.handleAddCharacter(character);
  };

  private handleRosterKeyDown = (event: KeyboardEvent): void => {
    if (!this.rosterPickerOpen && ["ArrowDown", "ArrowUp"].includes(event.key)) {
      this.rosterPickerOpen = true;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.rosterActiveIndex = Math.min(this.rosterActiveIndex + 1, this.rosterResults.length - 1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      this.rosterActiveIndex = Math.max(this.rosterActiveIndex - 1, -1);
      return;
    }

    if (event.key === "Enter") {
      if (this.rosterActiveIndex >= 0 && this.rosterActiveIndex < this.rosterResults.length) {
        event.preventDefault();
        this.addCharacterFromResult(this.rosterResults[this.rosterActiveIndex]);
      }
      return;
    }

    if (event.key === "Escape") {
      this.rosterPickerOpen = false;
      this.rosterActiveIndex = -1;
    }
  };

  private updateParticipant(id: string, changes: Partial<Participant>) {
    const participants = this.encounter.participants.map((p) => (p.id === id ? { ...p, ...changes } : p));
    this.encounter = { ...this.encounter, participants };
    this.saveEncounter();
  }

  private updateLinkedCharacter(
    participantId: string,
    changes: Partial<Pick<Character, "name" | "health" | "initiative">>,
  ): void {
    const participant = this.encounter.participants.find((item) => item.id === participantId);
    if (!participant?.characterId) {
      return;
    }

    const character = this.rosterCharacters.find((item) => item.id === participant.characterId);
    if (!character) {
      return;
    }

    upsertCharacter({
      ...character,
      ...changes,
      updatedAt: Date.now(),
    });
  }

  private handleDamage(e: CustomEvent<{ id: string; amount: number }>) {
    const { id, amount } = e.detail;
    const p = this.encounter.participants.find((x) => x.id === id);
    if (!p) return;
    const hp = Math.max(0, p.hp - amount);
    this.updateParticipant(id, { hp });
    this.updateLinkedCharacter(id, { health: hp });
    if (hp === 0) this.showToast(`${p.name} is down!`);
  }

  private handleHeal(e: CustomEvent<{ id: string; amount: number }>) {
    const { id, amount } = e.detail;
    const p = this.encounter.participants.find((x) => x.id === id);
    if (!p) return;
    const hp = Math.min(p.maxHp, p.hp + amount);
    this.updateParticipant(id, { hp });
    this.updateLinkedCharacter(id, { health: hp });
  }

  private handleRemove(e: CustomEvent<{ id: string }>) {
    const participants = this.encounter.participants.filter((p) => p.id !== e.detail.id);
    this.encounter = { ...this.encounter, participants };
    this.saveEncounter();
  }

  private handleNotes(e: CustomEvent<{ id: string; notes: string }>) {
    this.updateParticipant(e.detail.id, { notes: e.detail.notes });
  }

  private handleRemoveCondition(e: CustomEvent<{ id: string; condition: string }>) {
    const p = this.encounter.participants.find((x) => x.id === e.detail.id);
    if (!p) return;
    this.updateParticipant(e.detail.id, { conditions: p.conditions.filter((c) => c !== e.detail.condition) });
  }

  private handleMoveUp(e: CustomEvent<{ id: string }>) {
    const idx = this.encounter.participants.findIndex((p) => p.id === e.detail.id);
    if (idx <= 0) return;
    const arr = [...this.encounter.participants];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    this.encounter = { ...this.encounter, participants: arr };
    this.saveEncounter();
  }

  private handleMoveDown(e: CustomEvent<{ id: string }>) {
    const idx = this.encounter.participants.findIndex((p) => p.id === e.detail.id);
    if (idx < 0 || idx >= this.encounter.participants.length - 1) return;
    const arr = [...this.encounter.participants];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    this.encounter = { ...this.encounter, participants: arr };
    this.saveEncounter();
  }

  private handleParticipantEdit(e: CustomEvent<{ id: string; name: string; health: number; initiative: number }>) {
    const participant = this.encounter.participants.find((item) => item.id === e.detail.id);
    if (!participant) {
      return;
    }

    const pendingInitiative = e.detail.initiative === participant.initiative ? null : e.detail.initiative;
    this.updateParticipant(e.detail.id, {
      name: e.detail.name,
      hp: e.detail.health,
      maxHp: e.detail.health,
      pendingInitiative,
    });

    if (participant.characterId) {
      this.updateLinkedCharacter(e.detail.id, {
        name: e.detail.name,
        health: e.detail.health,
        initiative: e.detail.initiative,
      });
    }
  }

  override render() {
    const enc = this.encounter;
    const card = this.currentCard();
    const actionType = computeActionType(enc);
    const active = card ? participantsForCard(enc.participants, card) : [];
    const activeIds = new Set(active.map((p) => p.id));
    const rosterResults = this.rosterResults;
    const cardsRemaining = DECK_SIZE - (enc.currentCardIndex + 1);
    const allCardsDrawn = enc.currentCardIndex >= DECK_SIZE - 1;

    const actionLabel =
      actionType === "bonus"
        ? "⚔ Bonus Action"
        : actionType === "minor"
          ? "⚡ Minor or Heroic Action"
          : "⚔ Major Action";

    return html`
      <h1>Encounter Tracker</h1>
      <p class="subtitle">Card-based initiative — draw from the 10-card deck each round.</p>

      <!-- Encounter name + round badge -->
      <div class="encounter-header">
        <input
          class="encounter-name-input"
          .value=${enc.name}
          @input=${this.handleNameChange}
          aria-label="Encounter name"
          placeholder="Encounter name" />
        <label class="level-input-wrap">
          Level
          <select
            class="level-select"
            .value=${String(enc.level)}
            @change=${this.handleLevelChange}
            aria-label="Encounter level">
            ${Array.from({ length: 30 }, (_, index) => index + 1).map(
              (level) => html`
                <option value=${String(level)}>${level}</option>
              `,
            )}
          </select>
        </label>
        <div class="round-badge">
          Round
          <span class="round-number">${enc.round}</span>
        </div>
      </div>

      <!-- Card Deck Section -->
      <div class="deck-section">
        <div class="deck-section-title">Initiative Deck</div>

        <!-- Progress pips -->
        <div class="deck-progress">
          <div class="deck-pips" aria-label="Cards played">
            ${enc.deck.map((cardId, i) => {
              const c = cardById(cardId, enc.level);
              const typeClass = c ? `${c.participantType}-card` : "";
              const stateClass = i < enc.currentCardIndex ? "played" : i === enc.currentCardIndex ? "current" : "";
              const tooltipTitle = c ? c.label : cardId;
              const tooltipMeta = c ? cardActionTypeLabel(c.actionType) : "Unknown card";
              return html`
                <div class="deck-pip ${typeClass} ${stateClass}">
                  <div class="deck-pip-tooltip" role="tooltip">
                    <div>${tooltipTitle}</div>
                    <div class="deck-pip-tooltip-meta">${tooltipMeta}</div>
                  </div>
                </div>
              `;
            })}
          </div>
          <span>
            ${enc.currentCardIndex < 0
              ? "Round not started"
              : allCardsDrawn
                ? "All cards drawn"
                : `${cardsRemaining} card${cardsRemaining !== 1 ? "s" : ""} remaining`}
          </span>
        </div>

        <!-- Current card display -->
        ${card
          ? html`
              <div class="current-card ${card.participantType}">
                <div class="card-label">${card.label}</div>
                <div class="card-action-type ${actionType}">${actionLabel}</div>
                ${active.length > 0
                  ? html`
                      <div class="card-active-names">
                        Acting:
                        <strong>${active.map((p) => p.name).join(", ")}</strong>
                      </div>
                    `
                  : html`
                      <div class="card-no-match">No matching participants for this card</div>
                    `}
              </div>
            `
          : html`
              <div class="current-card none">
                <div class="card-label">Round not started</div>
                <div class="card-action-type">Draw the first card to begin</div>
              </div>
            `}

        <!-- Draw / End Round controls -->
        <div class="controls-bar" style="margin-bottom: 0; margin-top: 0.875rem;">
          ${allCardsDrawn
            ? html`
                <button class="btn btn-end-round" @click=${this.startNewRound}>↺ End Round &amp; Reshuffle</button>
              `
            : html`
                <button class="btn btn-primary" @click=${this.drawNextCard} ?disabled=${enc.participants.length === 0}>
                  ▶ Draw Next Card
                </button>
              `}
          <button class="btn btn-muted" @click=${this.shuffleRemainingCards}>🔀 Shuffle Remaining</button>
          <button class="btn btn-danger" @click=${this.resetEncounter}>New Encounter</button>
        </div>
      </div>

      <!-- Participants -->
      <div class="section-title">Participants (${enc.participants.length})</div>

      <div
        class="participants-list"
        @participant-damage=${this.handleDamage}
        @participant-heal=${this.handleHeal}
        @participant-remove=${this.handleRemove}
        @participant-notes=${this.handleNotes}
        @participant-remove-condition=${this.handleRemoveCondition}
        @participant-move-up=${this.handleMoveUp}
        @participant-move-down=${this.handleMoveDown}
        @participant-edit=${this.handleParticipantEdit}>
        ${enc.participants.length === 0
          ? html`
              <div class="empty-state">No participants yet. Add monsters or players below to start the encounter.</div>
            `
          : enc.participants.map(
              (p, i) => html`
                <encounter-participant
                  .participant=${p}
                  .isActive=${activeIds.has(p.id)}
                  .isFirst=${i === 0}
                  .isLast=${i === enc.participants.length - 1}></encounter-participant>
              `,
            )}
      </div>

      <!-- Character roster quick-add -->
      <div class="section-title">Add from character roster</div>
      <div class="character-roster">
        ${this.rosterCharacters.length === 0
          ? html`
              <div class="empty-state">No saved characters available.</div>
            `
          : html`
              <div class="roster-field">
                <div class="roster-helper">Search by character, race, or class.</div>
                <div class="roster-search-shell">
                  <div class="roster-search-wrapper">
                    <span class="roster-search-icon">${searchIcon}</span>
                    <input
                      class="roster-search-input"
                      type="text"
                      .value=${this.rosterQuery}
                      placeholder="Type to add a roster character"
                      @input=${this.handleRosterInput}
                      @keydown=${this.handleRosterKeyDown}
                      @focus=${this.handleRosterFocus}
                      @blur=${this.handleRosterBlur} />
                  </div>
                  ${this.rosterPickerOpen
                    ? html`
                        <div class="roster-results" role="listbox">
                          ${rosterResults.length === 0
                            ? html`
                                <div class="empty-state">No matching characters.</div>
                              `
                            : rosterResults.map(
                                (character, index) => html`
                                  <button
                                    class="roster-result ${index === this.rosterActiveIndex ? "active" : ""}"
                                    @click=${() => this.addCharacterFromResult(character)}>
                                    <div class="roster-item">
                                      <div class="roster-item-top">
                                        <div class="roster-name">${character.name}</div>
                                        <div class="roster-meta">${character.health} HP</div>
                                      </div>
                                      <div class="roster-meta">${character.race.title} • ${character.class.title}</div>
                                    </div>
                                  </button>
                                `,
                              )}
                        </div>
                      `
                    : nothing}
                </div>
              </div>
            `}
      </div>

      <!-- Add form -->
      <encounter-add-form @participant-added=${this.handleParticipantAdded}></encounter-add-form>

      <!-- Toast notification -->
      ${this.toast
        ? html`
            <div class="toast" role="status" aria-live="polite">${this.toast}</div>
          `
        : nothing}
    `;
  }
}
