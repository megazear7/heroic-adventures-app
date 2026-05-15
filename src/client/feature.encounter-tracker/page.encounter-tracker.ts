import { LitElement, html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import {
  Encounter,
  EncounterSchema,
  Participant,
  INITIATIVE_CARDS,
  InitiativeCard,
} from "../../shared/type.encounter.js";
import "./component.encounter-add-form.js";
import "./component.encounter-participant.js";

const STORAGE_KEY = "ha-encounter-tracker";
const DECK_SIZE = INITIATIVE_CARDS.length; // 10

function shuffleDeck(): string[] {
  const ids = INITIATIVE_CARDS.map((c) => c.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

function newEncounter(): Encounter {
  return {
    id: crypto.randomUUID(),
    name: "New Encounter",
    round: 1,
    currentCardIndex: -1,
    deck: shuffleDeck(),
    participants: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function cardById(id: string): InitiativeCard | undefined {
  return INITIATIVE_CARDS.find((c) => c.id === id);
}

function participantsForCard(participants: Participant[], card: InitiativeCard): Participant[] {
  return participants.filter((p) => {
    if (p.type !== card.participantType) return false;
    if (card.minInit === null) return true;
    return p.initiative >= card.minInit && p.initiative <= (card.maxInit as number);
  });
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
      align-items: center;
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
    }
    .deck-pip {
      width: 10px;
      height: 10px;
      border-radius: 2px;
      border: 1px solid rgba(201, 168, 76, 0.2);
      background: var(--color-primary-surface-overlay, #1e1e38);
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
    .deck-pip.player-card.played, .deck-pip.player-card.current {
      background: rgba(100, 180, 255, 0.5);
    }
    .deck-pip.monster-card {
      border-color: rgba(255, 100, 100, 0.5);
    }
    .deck-pip.monster-card.played, .deck-pip.monster-card.current {
      background: rgba(255, 100, 100, 0.5);
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
      transition: background 150ms ease, color 150ms ease;
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

    /* ---- Export ---- */
    .export-area {
      margin-top: 2rem;
      background: var(--color-primary-surface-raised, #16162a);
      border: 1px solid rgba(201, 168, 76, 0.12);
      border-radius: 12px;
      padding: 1.25rem;
    }
    .export-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--color-primary-text-muted, #8a8780);
      margin-bottom: 0.75rem;
    }
    .export-btns {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    pre.export-preview {
      margin-top: 1rem;
      font-size: 0.78rem;
      font-family: monospace;
      background: var(--color-primary-surface-overlay, #1e1e38);
      color: var(--color-primary-text, #e2e0d6);
      border-radius: 8px;
      padding: 0.875rem;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
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
  @state() private showExport = false;
  @state() private exportText = "";
  @state() private toast: string | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this.loadEncounter();
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
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toast = null;
    }, 1800);
  }

  private currentCard(): InitiativeCard | null {
    const enc = this.encounter;
    if (enc.currentCardIndex < 0 || enc.currentCardIndex >= enc.deck.length) return null;
    return cardById(enc.deck[enc.currentCardIndex]) ?? null;
  }

  /* ---- Encounter controls ---- */

  private handleNameChange(e: Event) {
    this.encounter = { ...this.encounter, name: (e.target as HTMLInputElement).value };
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
    this.encounter = { ...enc, currentCardIndex: nextIdx };
    this.saveEncounter();
    const card = cardById(enc.deck[nextIdx]);
    if (card) {
      const action = card.actionType === "major" ? "Major Action" : "Minor or Heroic Action";
      this.showToast(`${card.label} — ${action}`);
    }
  }

  private startNewRound() {
    const newRound = this.encounter.round + 1;
    this.encounter = {
      ...this.encounter,
      round: newRound,
      currentCardIndex: -1,
      deck: shuffleDeck(),
    };
    this.saveEncounter();
    this.showToast(`Round ${newRound} — Deck reshuffled!`);
  }

  private resetEncounter() {
    if (!confirm("Start a new encounter? This will clear all participants and reset to Round 1.")) return;
    this.encounter = newEncounter();
    this.saveEncounter();
    this.showExport = false;
  }

  /* ---- Participant handlers ---- */

  private handleParticipantAdded(e: CustomEvent<Participant>) {
    const updated = [...this.encounter.participants, e.detail];
    this.encounter = { ...this.encounter, participants: updated };
    this.saveEncounter();
  }

  private updateParticipant(id: string, changes: Partial<Participant>) {
    const participants = this.encounter.participants.map((p) => (p.id === id ? { ...p, ...changes } : p));
    this.encounter = { ...this.encounter, participants };
    this.saveEncounter();
  }

  private handleDamage(e: CustomEvent<{ id: string; amount: number }>) {
    const { id, amount } = e.detail;
    const p = this.encounter.participants.find((x) => x.id === id);
    if (!p) return;
    const hp = Math.max(0, p.hp - amount);
    this.updateParticipant(id, { hp });
    if (hp === 0) this.showToast(`${p.name} is down!`);
  }

  private handleHeal(e: CustomEvent<{ id: string; amount: number }>) {
    const { id, amount } = e.detail;
    const p = this.encounter.participants.find((x) => x.id === id);
    if (!p) return;
    const hp = Math.min(p.maxHp, p.hp + amount);
    this.updateParticipant(id, { hp });
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

  /* ---- Export ---- */

  private exportJson() {
    const blob = new Blob([JSON.stringify(this.encounter, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `encounter-${this.encounter.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast("Exported JSON");
  }

  private buildTextSummary(): string {
    const e = this.encounter;
    const card = this.currentCard();
    const active = card ? participantsForCard(e.participants, card) : [];
    const activeIds = new Set(active.map((p) => p.id));
    const lines = [
      `Encounter: ${e.name}`,
      `Round: ${e.round} | Card: ${e.currentCardIndex + 1}/${DECK_SIZE}`,
      card
        ? `Current Card: ${card.label} — ${card.actionType === "major" ? "Major Action" : "Minor or Heroic Action"}`
        : `Current Card: (none drawn)`,
      ``,
      ...e.participants.map(
        (p) =>
          `${activeIds.has(p.id) ? "▶ " : "  "}[${p.type === "monster" ? "M" : "P"}] ${p.name} | Init: ${p.initiative} | HP: ${p.hp}/${p.maxHp}${p.notes ? ` | Notes: ${p.notes}` : ""}`,
      ),
    ];
    return lines.join("\n");
  }

  private toggleTextExport() {
    this.showExport = !this.showExport;
    if (this.showExport) {
      this.exportText = this.buildTextSummary();
    }
  }

  private copyText() {
    navigator.clipboard.writeText(this.exportText).then(() => this.showToast("Copied!"));
  }

  override render() {
    const enc = this.encounter;
    const card = this.currentCard();
    const active = card ? participantsForCard(enc.participants, card) : [];
    const activeIds = new Set(active.map((p) => p.id));
    const cardsRemaining = DECK_SIZE - (enc.currentCardIndex + 1);
    const allCardsDrawn = enc.currentCardIndex >= DECK_SIZE - 1;

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
        <div class="round-badge">
          Round <span class="round-number">${enc.round}</span>
        </div>
      </div>

      <!-- Card Deck Section -->
      <div class="deck-section">
        <div class="deck-section-title">Initiative Deck</div>

        <!-- Progress pips -->
        <div class="deck-progress">
          <div class="deck-pips" aria-label="Cards played">
            ${enc.deck.map((cardId, i) => {
              const c = cardById(cardId);
              const typeClass = c ? `${c.participantType}-card` : "";
              const stateClass = i < enc.currentCardIndex ? "played" : i === enc.currentCardIndex ? "current" : "";
              return html`<div class="deck-pip ${typeClass} ${stateClass}" title="${c?.label ?? cardId}"></div>`;
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
                <div class="card-action-type ${card.actionType}">
                  ${card.actionType === "major" ? "⚔ Major Action" : "⚡ Minor or Heroic Action"}
                </div>
                ${active.length > 0
                  ? html`
                      <div class="card-active-names">
                        Acting: <strong>${active.map((p) => p.name).join(", ")}</strong>
                      </div>
                    `
                  : html`
                      <div class="card-no-match">No matching participants in this tier</div>
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
                <button class="btn btn-end-round" @click=${this.startNewRound}>
                  ↺ End Round &amp; Reshuffle
                </button>
              `
            : html`
                <button class="btn btn-primary" @click=${this.drawNextCard} ?disabled=${enc.participants.length === 0}>
                  ▶ Draw Next Card
                </button>
              `}
          <button class="btn btn-muted" @click=${this.toggleTextExport}>
            ${this.showExport ? "Hide Export" : "Export"}
          </button>
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
        @participant-move-down=${this.handleMoveDown}>
        ${enc.participants.length === 0
          ? html`
              <div class="empty-state">
                No participants yet. Add monsters or players below to start the encounter.
              </div>
            `
          : enc.participants.map(
              (p, i) => html`
                <encounter-participant
                  .participant=${p}
                  .isActive=${activeIds.has(p.id)}
                  .isFirst=${i === 0}
                  .isLast=${i === enc.participants.length - 1}>
                </encounter-participant>
              `,
            )}
      </div>

      <!-- Add form -->
      <encounter-add-form @participant-added=${this.handleParticipantAdded}></encounter-add-form>

      <!-- Export panel -->
      ${this.showExport
        ? html`
            <div class="export-area">
              <div class="export-title">Export Encounter</div>
              <div class="export-btns">
                <button class="btn" @click=${this.copyText}>Copy Text</button>
                <button class="btn" @click=${this.exportJson}>Download JSON</button>
              </div>
              <pre class="export-preview">${this.exportText}</pre>
            </div>
          `
        : nothing}

      <!-- Toast notification -->
      ${this.toast
        ? html`
            <div class="toast" role="status" aria-live="polite">${this.toast}</div>
          `
        : nothing}
    `;
  }
}
