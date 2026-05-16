import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { Participant } from "../../shared/type.encounter.js";
import { pencilIcon } from "../icons.js";

@customElement("encounter-participant")
export class EncounterParticipant extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
    .card {
      background: var(--color-primary-surface-raised, #16162a);
      border: 2px solid rgba(201, 168, 76, 0.12);
      border-radius: 12px;
      padding: 1rem;
      transition: border-color 200ms ease, box-shadow 200ms ease;
      position: relative;
    }
    .card.active-turn {
      border-color: var(--color-1, #c9a84c);
      box-shadow: 0 0 0 2px rgba(201, 168, 76, 0.18), 0 4px 16px rgba(201, 168, 76, 0.1);
    }
    .card.dead {
      opacity: 0.5;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }
    .active-indicator {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 2px 8px;
      border-radius: 20px;
      background: var(--color-1, #c9a84c);
      color: #1a1a2e;
      flex-shrink: 0;
      animation: pulse 1.5s ease infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .type-badge {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 2px 8px;
      border-radius: 20px;
      flex-shrink: 0;
    }
    .type-badge.monster {
      background: rgba(255, 100, 100, 0.18);
      color: #ff8888;
    }
    .type-badge.player {
      background: rgba(100, 180, 255, 0.18);
      color: #88ccff;
    }
    .name {
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-primary-text, #e2e0d6);
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .name-wrap {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      flex: 1;
      min-width: 0;
    }
    .edit-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: none;
      color: var(--color-primary-text-muted, #8a8780);
      cursor: pointer;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity 120ms ease;
      flex-shrink: 0;
    }
    .edit-btn:hover {
      color: var(--color-1, #c9a84c);
    }
    .card:hover .edit-btn,
    .edit-btn:focus-visible {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }
    @media (hover: none) {
      .edit-btn {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
      }
    }
    .initiative-badge {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-primary-text-muted, #8a8780);
      background: var(--color-primary-surface-overlay, #1e1e38);
      padding: 2px 10px;
      border-radius: 20px;
      flex-shrink: 0;
    }
    .initiative-badge.pending {
      color: #88ccff;
    }
    .stats-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }
    .hp-display {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .hp-label {
      font-size: 0.75rem;
      color: var(--color-primary-text-muted, #8a8780);
    }
    .hp-value {
      font-size: 1.1rem;
      font-weight: 700;
    }
    .hp-value.healthy {
      color: #6ee36e;
    }
    .hp-value.injured {
      color: #f0c060;
    }
    .hp-value.critical {
      color: #ff7070;
    }
    .hp-value.dead {
      color: var(--color-primary-text-muted, #8a8780);
    }
    .hp-bar-wrap {
      flex: 1;
      min-width: 80px;
      height: 6px;
      background: var(--color-primary-surface-overlay, #1e1e38);
      border-radius: 4px;
      overflow: hidden;
    }
    .hp-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 300ms ease, background 300ms ease;
    }
    .hp-bar.healthy {
      background: #6ee36e;
    }
    .hp-bar.injured {
      background: #f0c060;
    }
    .hp-bar.critical {
      background: #ff7070;
    }
    .hp-bar.dead {
      background: #555;
    }
    .actions-row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      align-items: center;
    }
    .adjust-group {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex: 1;
      min-width: 200px;
    }
    .adjust-group input[type="number"] {
      width: 70px;
      padding: 0.4rem 0.5rem;
      border-radius: 6px;
      border: 1px solid rgba(201, 168, 76, 0.2);
      background: var(--color-primary-surface-overlay, #1e1e38);
      color: var(--color-primary-text, #e2e0d6);
      font-size: 0.9rem;
      font-family: var(--font-family, sans-serif);
      outline: none;
      text-align: center;
    }
    .adjust-group input[type="number"]:focus {
      border-color: var(--color-1, #c9a84c);
    }
    .btn {
      padding: 0.4rem 0.9rem;
      border-radius: 6px;
      border: 1px solid currentColor;
      background: transparent;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 150ms ease, color 150ms ease;
      min-height: 36px;
      touch-action: manipulation;
    }
    .btn-damage {
      color: #ff8888;
      border-color: rgba(255, 100, 100, 0.35);
    }
    .btn-damage:hover {
      background: rgba(255, 100, 100, 0.15);
    }
    .btn-heal {
      color: #6ee36e;
      border-color: rgba(110, 227, 110, 0.35);
    }
    .btn-heal:hover {
      background: rgba(110, 227, 110, 0.12);
    }
    .btn-remove {
      color: var(--color-primary-text-muted, #8a8780);
      border-color: rgba(138, 135, 128, 0.2);
      margin-left: auto;
    }
    .btn-remove:hover {
      color: #ff8888;
      border-color: rgba(255, 100, 100, 0.35);
    }
    .order-btns {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .btn-order {
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      border: 1px solid rgba(201, 168, 76, 0.2);
      background: var(--color-primary-surface-overlay, #1e1e38);
      color: var(--color-primary-text-muted, #8a8780);
      font-size: 0.7rem;
      cursor: pointer;
      line-height: 1.2;
      min-height: 24px;
      touch-action: manipulation;
    }
    .btn-order:hover {
      color: var(--color-1, #c9a84c);
      border-color: rgba(201, 168, 76, 0.4);
    }
    .notes-section {
      margin-top: 0.5rem;
    }
    .notes-toggle {
      background: none;
      border: none;
      color: var(--color-primary-text-muted, #8a8780);
      font-size: 0.78rem;
      cursor: pointer;
      padding: 0;
      text-decoration: underline;
      touch-action: manipulation;
    }
    .notes-toggle:hover {
      color: var(--color-1, #c9a84c);
    }
    textarea.notes-input {
      width: 100%;
      box-sizing: border-box;
      margin-top: 0.4rem;
      padding: 0.5rem;
      border-radius: 6px;
      border: 1px solid rgba(201, 168, 76, 0.15);
      background: var(--color-primary-surface-overlay, #1e1e38);
      color: var(--color-primary-text, #e2e0d6);
      font-size: 0.85rem;
      font-family: var(--font-family, sans-serif);
      resize: vertical;
      min-height: 56px;
      outline: none;
    }
    textarea.notes-input:focus {
      border-color: var(--color-1, #c9a84c);
    }
    .conditions-row {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
      margin-top: 0.35rem;
    }
    .condition-chip {
      font-size: 0.7rem;
      padding: 1px 8px;
      border-radius: 20px;
      background: rgba(201, 168, 76, 0.15);
      color: var(--color-1, #c9a84c);
      cursor: pointer;
    }
    .condition-chip:hover {
      background: rgba(201, 168, 76, 0.28);
    }
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal {
      width: min(520px, 100%);
      background: var(--color-primary-surface-raised, #16162a);
      border: 1px solid rgba(201, 168, 76, 0.2);
      border-radius: 12px;
      padding: 1rem;
      display: grid;
      gap: 0.75rem;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }
    .modal-title {
      margin: 0;
      font-size: 1rem;
      color: var(--color-primary-text, #e2e0d6);
    }
    .modal-close {
      border: none;
      background: none;
      color: var(--color-primary-text-muted, #8a8780);
      cursor: pointer;
    }
    .modal-form {
      display: grid;
      gap: 0.65rem;
    }
    .modal-form label {
      display: grid;
      gap: 0.25rem;
      font-size: 0.8rem;
      color: var(--color-primary-text-muted, #8a8780);
    }
    .modal-form input {
      font-size: 0.95rem;
      font-family: var(--font-family, sans-serif);
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      border: 1px solid rgba(201, 168, 76, 0.2);
      background: var(--color-primary-surface-overlay, #1e1e38);
      color: var(--color-primary-text, #e2e0d6);
      outline: none;
      transition: border-color 200ms ease;
      width: 100%;
      box-sizing: border-box;
    }
    .modal-form input:focus {
      border-color: var(--color-1, #c9a84c);
    }
    .modal-hint {
      margin: 0;
      font-size: 0.75rem;
      color: var(--color-primary-text-muted, #8a8780);
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    .modal-btn {
      padding: 0.5rem 0.85rem;
      border-radius: 6px;
      border: 1px solid rgba(201, 168, 76, 0.2);
      background: transparent;
      color: var(--color-primary-text, #e2e0d6);
      cursor: pointer;
    }
    .modal-btn.primary {
      background: var(--color-1, #c9a84c);
      color: #1a1a2e;
      border-color: var(--color-1, #c9a84c);
      font-weight: 700;
    }
    @media (max-width: 480px) {
      .card {
        padding: 0.75rem;
        border-radius: 8px;
      }
      .adjust-group {
        min-width: 0;
        flex-wrap: wrap;
      }
    }
  `;

  @property({ type: Object }) participant!: Participant;
  /** True when the currently drawn card activates this participant */
  @property({ type: Boolean }) isActive = false;
  @property({ type: Boolean }) isFirst = false;
  @property({ type: Boolean }) isLast = false;

  @state() private adjustAmount = 1;
  @state() private showNotes = false;
  @state() private editModalOpen = false;
  @state() private editNameDraft = "";
  @state() private editHealthDraft = "1";
  @state() private editInitiativeDraft = "1";

  private hpClass(): string {
    const pct = this.participant.hp / this.participant.maxHp;
    if (this.participant.hp <= 0) return "dead";
    if (pct <= 0.25) return "critical";
    if (pct <= 0.5) return "injured";
    return "healthy";
  }

  private dispatch(type: string, detail: unknown) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  private handleDamage() {
    this.dispatch("participant-damage", { id: this.participant.id, amount: this.adjustAmount });
  }

  private handleHeal() {
    this.dispatch("participant-heal", { id: this.participant.id, amount: this.adjustAmount });
  }

  private handleRemove() {
    this.dispatch("participant-remove", { id: this.participant.id });
  }

  private handleMoveUp() {
    this.dispatch("participant-move-up", { id: this.participant.id });
  }

  private handleMoveDown() {
    this.dispatch("participant-move-down", { id: this.participant.id });
  }

  private handleNotesChange(e: Event) {
    this.dispatch("participant-notes", {
      id: this.participant.id,
      notes: (e.target as HTMLTextAreaElement).value,
    });
  }

  private openEditModal() {
    const p = this.participant;
    this.editNameDraft = p.name;
    this.editHealthDraft = String(p.maxHp);
    this.editInitiativeDraft = String(p.pendingInitiative ?? p.initiative);
    this.editModalOpen = true;
  }

  private closeEditModal = (): void => {
    this.editModalOpen = false;
  };

  private saveEditModal = (): void => {
    const name = this.editNameDraft.trim();
    const health = parseInt(this.editHealthDraft, 10);
    const initiative = parseInt(this.editInitiativeDraft, 10);
    if (!name || Number.isNaN(health) || health < 1 || Number.isNaN(initiative) || initiative < 1) {
      return;
    }
    this.dispatch("participant-edit", {
      id: this.participant.id,
      name,
      health,
      initiative,
    });
    this.closeEditModal();
  };

  override render() {
    const p = this.participant;
    const pct = Math.max(0, Math.min(1, p.hp / p.maxHp));
    const cls = this.hpClass();

    return html`
      <div class="card ${this.isActive ? "active-turn" : ""} ${p.hp <= 0 ? "dead" : ""}">
        <div class="header">
          ${this.isActive
            ? html`
                <span class="active-indicator">Acting Now</span>
              `
            : nothing}
          <span class="type-badge ${p.type}">${p.type === "monster" ? "Monster" : "Player"}</span>
          <span class="name-wrap">
            <span class="name">${p.name}</span>
            <button class="edit-btn" type="button" title="Edit participant" aria-label="Edit participant" @click=${this.openEditModal}>
              ${pencilIcon}
            </button>
          </span>
          <span class="initiative-badge ${p.pendingInitiative ? "pending" : ""}" title="Initiative ${p.initiative}">
            Init ${p.initiative}${p.pendingInitiative ? html` → ${p.pendingInitiative}` : nothing}
          </span>
          <div class="order-btns">
            <button class="btn-order" @click=${this.handleMoveUp} ?disabled=${this.isFirst} title="Move up" aria-label="Move up">▲</button>
            <button
              class="btn-order"
              @click=${this.handleMoveDown}
              ?disabled=${this.isLast}
              title="Move down"
              aria-label="Move down">▼</button>
          </div>
        </div>

        <div class="stats-row">
          <div class="hp-display">
            <span class="hp-label">HP</span>
            <span class="hp-value ${cls}">${p.hp}/${p.maxHp}</span>
          </div>
          <div class="hp-bar-wrap">
            <div class="hp-bar ${cls}" style="width: ${Math.round(pct * 100)}%"></div>
          </div>
        </div>

        <div class="actions-row">
          <div class="adjust-group">
            <input
              type="number"
              min="1"
              .value=${String(this.adjustAmount)}
              @input=${(e: Event) => {
                const v = parseInt((e.target as HTMLInputElement).value, 10);
                this.adjustAmount = isNaN(v) || v < 1 ? 1 : v;
              }}
              aria-label="Amount" />
            <button class="btn btn-damage" @click=${this.handleDamage}>Damage</button>
            <button class="btn btn-heal" @click=${this.handleHeal}>Heal</button>
          </div>
          <button class="btn btn-remove" @click=${this.handleRemove} title="Remove participant">Remove</button>
        </div>

        ${p.conditions.length > 0
          ? html`
              <div class="conditions-row">
                ${p.conditions.map(
                  (c) => html`
                    <span
                      class="condition-chip"
                      @click=${() => this.dispatch("participant-remove-condition", { id: p.id, condition: c })}
                      title="Click to remove condition"
                      >${c} ×</span
                    >
                  `,
                )}
              </div>
            `
          : nothing}

        <div class="notes-section">
          <button class="notes-toggle" @click=${() => (this.showNotes = !this.showNotes)}>
            ${this.showNotes ? "Hide notes" : `Notes${p.notes ? " ✎" : ""}`}
          </button>
          ${this.showNotes
            ? html`
                <textarea
                  class="notes-input"
                  placeholder="Add notes, conditions, status effects…"
                  .value=${p.notes}
                  @input=${this.handleNotesChange}></textarea>
              `
            : nothing}
        </div>
      </div>
      ${this.editModalOpen
        ? html`
            <div class="overlay" @click=${this.closeEditModal}>
              <div class="modal" @click=${(event: Event) => event.stopPropagation()}>
                <div class="modal-header">
                  <h3 class="modal-title">Edit Participant</h3>
                  <button class="modal-close" type="button" @click=${this.closeEditModal}>Close</button>
                </div>
                <div class="modal-form">
                  <label>
                    Name
                    <input
                      .value=${this.editNameDraft}
                      @input=${(event: Event) => {
                        this.editNameDraft = (event.target as HTMLInputElement).value;
                      }} />
                  </label>
                  <label>
                    Health
                    <input
                      type="number"
                      min="1"
                      .value=${this.editHealthDraft}
                      @input=${(event: Event) => {
                        this.editHealthDraft = (event.target as HTMLInputElement).value;
                      }} />
                  </label>
                  <label>
                    Initiative
                    <input
                      type="number"
                      min="1"
                      .value=${this.editInitiativeDraft}
                      @input=${(event: Event) => {
                        this.editInitiativeDraft = (event.target as HTMLInputElement).value;
                      }} />
                  </label>
                </div>
                <p class="modal-hint">Initiative changes take effect at the start of the next round.</p>
                <div class="modal-actions">
                  <button class="modal-btn" type="button" @click=${this.closeEditModal}>Cancel</button>
                  <button class="modal-btn primary" type="button" @click=${this.saveEditModal}>Save</button>
                </div>
              </div>
            </div>
          `
        : nothing}
    `;
  }
}
