import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { Character } from "../../shared/type.character.js";
import { MonsterType, Participant } from "../../shared/type.encounter.js";
import { getMonsterStatsForEncounterLevel } from "../../shared/util.monster-stats.js";
import { kebabIcon, shieldIcon } from "../icons.js";

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
      transition:
        border-color 200ms ease,
        box-shadow 200ms ease;
      position: relative;
    }
    .card.active-turn {
      border-color: var(--color-1, #c9a84c);
      box-shadow:
        0 0 0 2px rgba(201, 168, 76, 0.18),
        0 4px 16px rgba(201, 168, 76, 0.1);
    }
    .card.dead {
      opacity: 0.5;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      flex-wrap: nowrap;
      min-width: 0;
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
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
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
      background: var(--color-primary-surface-overlay);
      color: var(--color-primary-text-muted);
    }
    .type-badge.player {
      background: var(--color-primary-surface-overlay);
      color: var(--color-primary-text-muted);
    }
    .type-badge.monster-type {
      background: var(--color-primary-surface-overlay);
      color: var(--color-primary-text-muted);
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
      transition: opacity 120ms ease;
      flex-shrink: 0;
    }
    .edit-btn:hover {
      color: var(--color-1, #c9a84c);
    }
    .edit-btn:focus-visible {
      outline: 2px solid var(--color-1, #c9a84c);
      outline-offset: 2px;
    }
    .card:hover .edit-btn,
    .card:focus-within .edit-btn,
    .edit-btn:focus-visible {
      opacity: 1;
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
      transition:
        width 300ms ease,
        background 300ms ease;
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
      transition:
        background 150ms ease,
        color 150ms ease;
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
    .btn-toughness {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      color: var(--color-primary-text-muted, #8a8780);
      border-color: rgba(201, 168, 76, 0.25);
      min-width: 58px;
      justify-content: center;
    }
    .btn-toughness.active {
      color: var(--color-1, #c9a84c);
      background: rgba(201, 168, 76, 0.12);
    }
    .btn-toughness:not(.active) {
      opacity: 0.72;
    }
    .btn-toughness svg {
      flex-shrink: 0;
    }
    .menu-wrap {
      position: relative;
      margin-left: auto;
    }
    .menu-trigger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      color: var(--color-primary-text-muted, #8a8780);
      cursor: pointer;
      min-height: 32px;
      min-width: 32px;
      padding: 4px;
      border-radius: 999px;
    }
    .menu-trigger:hover {
      color: var(--color-1, #c9a84c);
      background: rgba(201, 168, 76, 0.08);
    }
    .menu {
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      background: var(--color-primary-surface-raised, #16162a);
      border: 1px solid rgba(201, 168, 76, 0.2);
      border-radius: 8px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
      z-index: 20;
      overflow: hidden;
      min-width: 170px;
    }
    .menu button {
      width: 100%;
      text-align: left;
      border: none;
      background: none;
      color: var(--color-primary-text, #e2e0d6);
      padding: 10px 12px;
      cursor: pointer;
      font: inherit;
      font-size: 0.82rem;
    }
    .menu button:hover {
      background: rgba(201, 168, 76, 0.08);
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
    .status-actions-row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      align-items: center;
    }
    .status-actions-row .notes-toggle {
      margin-left: auto;
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
    .statuses-section {
      margin-top: var(--size-medium);
    }
    .status-chips-row {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
      margin-bottom: 0.35rem;
    }
    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 20px;
      background: rgba(201, 168, 76, 0.15);
      color: var(--color-1, #c9a84c);
    }
    .status-chip-remove {
      border: none;
      background: none;
      color: inherit;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      font-size: 0.75rem;
      display: inline-flex;
      align-items: center;
      opacity: 0.7;
    }
    .status-chip-remove:hover {
      opacity: 1;
    }
    .status-picker-shell {
      position: relative;
    }
    .status-picker-trigger {
      background: none;
      border: 1px dashed rgba(201, 168, 76, 0.3);
      color: var(--color-primary-text-muted, #8a8780);
      font-size: 0.75rem;
      border-radius: 20px;
      padding: 2px 10px;
      cursor: pointer;
      touch-action: manipulation;
    }
    .status-picker-trigger:hover {
      border-color: var(--color-1, #c9a84c);
      color: var(--color-1, #c9a84c);
    }
    .status-search-wrapper {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--color-primary-surface-raised, #16162a);
      border: 1px solid rgba(201, 168, 76, 0.35);
      border-radius: 8px;
      padding: 6px 10px;
    }
    .status-search-wrapper:focus-within {
      border-color: var(--color-1, #c9a84c);
    }
    .status-search-input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      color: var(--color-primary-text, #e2e0d6);
      font-size: 0.85rem;
      font-family: var(--font-family, sans-serif);
      min-width: 0;
    }
    .status-search-cancel {
      border: none;
      background: none;
      color: var(--color-primary-text-muted, #8a8780);
      cursor: pointer;
      font-size: 0.8rem;
      padding: 0;
      touch-action: manipulation;
    }
    .status-search-cancel:hover {
      color: var(--color-primary-text, #e2e0d6);
    }
    .status-results {
      position: absolute;
      inset: calc(100% + 4px) 0 auto;
      z-index: 100;
      background: var(--color-primary-surface-raised, #16162a);
      border: 1px solid rgba(201, 168, 76, 0.2);
      border-radius: 8px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
      max-height: min(220px, 40vh);
      overflow-y: auto;
    }
    .status-result {
      display: block;
      width: 100%;
      text-align: left;
      border: none;
      border-bottom: 1px solid rgba(201, 168, 76, 0.07);
      background: transparent;
      color: var(--color-primary-text, #e2e0d6);
      cursor: pointer;
      padding: 0.55rem 0.85rem;
      font: inherit;
      font-size: 0.85rem;
      touch-action: manipulation;
    }
    .status-result:last-child {
      border-bottom: none;
    }
    .status-result.active,
    .status-result:hover {
      background: rgba(201, 168, 76, 0.1);
    }
    .status-result.create-new {
      color: var(--color-1, #c9a84c);
      font-style: italic;
    }
    .status-empty {
      padding: 0.5rem 0.85rem;
      color: var(--color-primary-text-muted, #8a8780);
      font-size: 0.8rem;
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
    .modal-form input,
    .modal-form select {
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
    .modal-form input:focus,
    .modal-form select:focus {
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
    .stats-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 0.9rem;
    }
    .stats-pill {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      background: var(--color-primary-surface-overlay, #1e1e38);
      color: var(--color-primary-text-muted, #8a8780);
      font-size: 0.72rem;
      font-weight: 600;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.6rem;
      margin-bottom: 0.9rem;
    }
    .stats-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      padding: 0.55rem 0.7rem;
      border-radius: 8px;
      background: var(--color-primary-surface-overlay, #1e1e38);
    }
    .stats-label {
      color: var(--color-primary-text-muted, #8a8780);
      font-size: 0.8rem;
    }
    .stats-value {
      color: var(--color-primary-text, #e2e0d6);
      font-weight: 700;
      text-align: right;
    }
    .stats-note {
      margin: 0 0 0.9rem;
      color: var(--color-primary-text-muted, #8a8780);
      font-size: 0.78rem;
      line-height: 1.45;
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
  /** Full list of available status names from the user's status library */
  @property({ type: Array }) availableStatuses: string[] = [];
  @property({ attribute: false }) linkedCharacter: Character | null = null;
  @property({ type: Number }) encounterLevel = 1;

  @state() private adjustAmount = 1;
  @state() private showNotes = false;
  @state() private editModalOpen = false;
  @state() private editNameDraft = "";
  @state() private editHealthDraft = "1";
  @state() private editInitiativeDraft = "1";
  @state() private editToughnessDraft = "0";
  @state() private editMonsterTypeDraft: MonsterType = "minion";
  @state() private statusPickerOpen = false;
  @state() private statusQuery = "";
  @state() private statusActiveIndex = -1;
  @state() private menuOpen = false;
  @state() private statsModalOpen = false;
  private editTriggerButton: HTMLButtonElement | null = null;
  private statusInputRef: HTMLInputElement | null = null;

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

  private displayInitiative(participant: Participant): number {
    return participant.pendingInitiative ?? participant.initiative;
  }

  private handleDamage() {
    this.dispatch("participant-damage", { id: this.participant.id, amount: this.adjustAmount });
  }

  private handleHeal() {
    this.dispatch("participant-heal", { id: this.participant.id, amount: this.adjustAmount });
  }

  private handleRemove() {
    this.closeMenu();
    this.dispatch("participant-remove", { id: this.participant.id });
  }

  private handleMoveUp() {
    this.dispatch("participant-move-up", { id: this.participant.id });
  }

  private handleMoveDown() {
    this.dispatch("participant-move-down", { id: this.participant.id });
  }

  private handleToughnessToggle() {
    this.dispatch("participant-toggle-toughness", { id: this.participant.id });
  }

  private handleDuplicate() {
    this.closeMenu();
    this.dispatch("participant-duplicate", { id: this.participant.id });
  }

  private handleViewStats = (): void => {
    this.closeMenu();
    this.statsModalOpen = true;
  };

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("click", this.handleDocumentClick);
  }

  private handleNotesChange(e: Event) {
    this.dispatch("participant-notes", {
      id: this.participant.id,
      notes: (e.target as HTMLTextAreaElement).value,
    });
  }

  private get statusResults(): string[] {
    const query = this.statusQuery.trim().toLowerCase();
    const assigned = new Set(this.participant.conditions.map((c) => c.toLowerCase()));
    const pool = this.availableStatuses.filter((s) => !assigned.has(s.toLowerCase()));
    if (!query) return pool;
    return pool.filter((s) => s.toLowerCase().includes(query));
  }

  private get showCreateOption(): boolean {
    const query = this.statusQuery.trim();
    if (!query) return false;
    const assigned = new Set(this.participant.conditions.map((c) => c.toLowerCase()));
    if (assigned.has(query.toLowerCase())) return false;
    const exact = this.availableStatuses.some((s) => s.toLowerCase() === query.toLowerCase());
    return !exact;
  }

  private openStatusPicker() {
    this.statusPickerOpen = true;
    this.statusQuery = "";
    this.statusActiveIndex = -1;
    void this.focusStatusInput();
  }

  private closeStatusPicker() {
    this.statusPickerOpen = false;
    this.statusQuery = "";
    this.statusActiveIndex = -1;
  }

  private async focusStatusInput(): Promise<void> {
    await this.updateComplete;
    this.statusInputRef = this.renderRoot.querySelector<HTMLInputElement>(".status-search-input");
    this.statusInputRef?.focus();
  }

  private handleStatusInput = (e: Event): void => {
    this.statusQuery = (e.target as HTMLInputElement).value;
    this.statusActiveIndex = -1;
  };

  private handleStatusKeyDown = (e: KeyboardEvent): void => {
    const results = this.statusResults;
    const hasCreate = this.showCreateOption;
    const totalItems = results.length + (hasCreate ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.statusActiveIndex = Math.min(this.statusActiveIndex + 1, totalItems - 1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      this.statusActiveIndex = Math.max(this.statusActiveIndex - 1, -1);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (this.statusActiveIndex >= 0 && this.statusActiveIndex < results.length) {
        this.selectStatus(results[this.statusActiveIndex]);
      } else if (hasCreate && this.statusActiveIndex === results.length) {
        this.createAndSelectStatus(this.statusQuery.trim());
      } else if (hasCreate && this.statusActiveIndex < 0) {
        // Enter with no selection and a create option: create directly
        this.createAndSelectStatus(this.statusQuery.trim());
      } else if (results.length === 1) {
        this.selectStatus(results[0]);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      this.closeStatusPicker();
    }
  };

  private handleStatusBlur = (e: FocusEvent): void => {
    const shell = this.renderRoot.querySelector(".status-picker-shell");
    const next = e.relatedTarget as Node | null;
    if (shell && next && shell.contains(next)) return;
    this.closeStatusPicker();
  };

  private selectStatus(name: string): void {
    this.dispatch("participant-add-condition", { id: this.participant.id, condition: name });
    this.closeStatusPicker();
  }

  private createAndSelectStatus(name: string): void {
    if (!name) return;
    this.dispatch("participant-create-status", { id: this.participant.id, condition: name });
    this.closeStatusPicker();
  }

  private toggleMenu = (): void => {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) {
      document.addEventListener("click", this.handleDocumentClick);
    } else {
      document.removeEventListener("click", this.handleDocumentClick);
    }
  };

  private closeMenu = (): void => {
    this.menuOpen = false;
    document.removeEventListener("click", this.handleDocumentClick);
  };

  private handleDocumentClick = (event: Event): void => {
    if (this.menuOpen && !event.composedPath().includes(this)) {
      this.closeMenu();
    }
  };

  private handleConvertToTemplate = (): void => {
    this.dispatch("participant-convert-to-template", { id: this.participant.id });
    this.closeMenu();
  };

  private handleEditParticipant = (event: Event): void => {
    this.closeMenu();
    this.openEditModal(event);
  };

  private openEditModal(event: Event) {
    const p = this.participant;
    this.editTriggerButton = event.currentTarget as HTMLButtonElement;
    this.editNameDraft = p.name;
    this.editHealthDraft = String(p.maxHp);
    this.editInitiativeDraft = String(this.displayInitiative(p));
    this.editToughnessDraft = String(p.toughness);
    this.editMonsterTypeDraft = p.monsterType ?? "minion";
    this.editModalOpen = true;
    void this.focusModalNameInput();
  }

  private closeEditModal = (): void => {
    this.editModalOpen = false;
    queueMicrotask(() => this.editTriggerButton?.focus());
  };

  private closeStatsModal = (): void => {
    this.statsModalOpen = false;
    queueMicrotask(() => this.editTriggerButton?.focus());
  };

  private async focusModalNameInput(): Promise<void> {
    await this.updateComplete;
    const input = this.renderRoot.querySelector<HTMLInputElement>("#edit-participant-name");
    input?.focus();
  }

  private handleModalKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (this.statsModalOpen) {
        this.closeStatsModal();
        return;
      }
      this.closeEditModal();
    }
  };

  private get statDetails(): Array<{ label: string; value: string | number }> {
    const participant = this.participant;

    if (participant.type === "monster" && participant.monsterType) {
      const stats = getMonsterStatsForEncounterLevel(this.encounterLevel, participant.monsterType);
      return [
        { label: "Skill", value: stats.skill },
        { label: "Agility", value: stats.ag },
        { label: "Aim", value: stats.aim },
        { label: "Tactics", value: stats.tac },
        { label: "Intellect", value: stats.int },
        { label: "Will", value: stats.will },
        { label: "Strength", value: stats.str },
        { label: "Initiative", value: stats.init },
        { label: "Toughness", value: stats.tough },
        { label: "Block", value: stats.block },
        { label: "Damage", value: stats.damage },
        { label: "Health", value: stats.health },
      ];
    }

    return [
      { label: "Skill", value: "-" },
      { label: "Agility", value: "-" },
      { label: "Aim", value: "-" },
      { label: "Tactics", value: "-" },
      { label: "Intellect", value: "-" },
      { label: "Will", value: "-" },
      { label: "Strength", value: "-" },
      { label: "Initiative", value: this.displayInitiative(participant) },
      { label: "Toughness", value: participant.toughness },
      { label: "Health", value: participant.maxHp },
      { label: "Current HP", value: participant.hp },
      { label: "Race / Class", value: this.linkedCharacter ? `${this.linkedCharacter.race.title} / ${this.linkedCharacter.class.title}` : "-" },
    ];
  }

  private saveEditModal = (): void => {
    const name = this.editNameDraft.trim();
    const health = parseInt(this.editHealthDraft, 10);
    const initiative = parseInt(this.editInitiativeDraft, 10);
    const toughness = parseInt(this.editToughnessDraft, 10);
    if (
      !name ||
      Number.isNaN(health) ||
      health < 1 ||
      Number.isNaN(initiative) ||
      initiative < 1 ||
      Number.isNaN(toughness) ||
      toughness < 0
    ) {
      return;
    }
    this.dispatch("participant-edit", {
      id: this.participant.id,
      name,
      health,
      initiative,
      toughness,
      monsterType: this.participant.type === "monster" ? this.editMonsterTypeDraft : undefined,
    });
    this.closeEditModal();
  };

  override render() {
    const p = this.participant;
    const pct = Math.max(0, Math.min(1, p.hp / p.maxHp));
    const cls = this.hpClass();
    const canDuplicate = p.type === "monster" || !p.characterId;

    return html`
      <div class="card ${this.isActive ? "active-turn" : ""} ${p.hp <= 0 ? "dead" : ""}">
        <div class="header">
          <span class="name-wrap">
            <span class="name">${p.name}</span>
          </span>
          <span class="type-badge ${p.type}">${p.type === "monster" ? "Monster" : "Player"}</span>
          ${p.type === "monster" && p.monsterType
            ? html`
                <span class="type-badge monster-type">${p.monsterType}</span>
              `
            : nothing}
          <span
            class="initiative-badge ${p.pendingInitiative ? "pending" : ""}"
            title=${p.pendingInitiative
              ? `Initiative ${p.initiative} (pending: ${p.pendingInitiative})`
              : `Initiative ${p.initiative}`}>
            Init
            ${p.initiative}${p.pendingInitiative
              ? html`
                  → ${p.pendingInitiative}
                `
              : nothing}
          </span>
          ${this.isActive
            ? html`
                <span class="active-indicator">Acting Now</span>
              `
            : nothing}
          <div class="menu-wrap">
            <button
              class="menu-trigger"
              type="button"
              @click=${this.toggleMenu}
              aria-label=${p.type === "monster" ? "Monster actions" : "Participant actions"}>
              ${kebabIcon}
            </button>
            ${this.menuOpen
              ? html`
                  <div class="menu">
                    <button type="button" @click=${this.handleViewStats}>View stats</button>
                    <button type="button" @click=${this.handleEditParticipant}>Edit participant</button>
                    ${canDuplicate
                      ? html`
                          <button type="button" @click=${this.handleDuplicate}>Duplicate</button>
                        `
                      : nothing}
                    <button type="button" ?disabled=${this.isFirst} @click=${this.handleMoveUp}>Move up</button>
                    <button type="button" ?disabled=${this.isLast} @click=${this.handleMoveDown}>Move down</button>
                    ${p.type === "monster"
                      ? html`
                          <button type="button" @click=${this.handleConvertToTemplate}>Convert to template</button>
                        `
                      : nothing}
                    <button type="button" @click=${this.handleRemove}>Remove participant</button>
                  </div>
                `
              : nothing}
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
            <button
              class="btn btn-toughness ${p.toughnessEnabled ? "active" : ""}"
              type="button"
              title=${p.toughnessEnabled ? `Toughness ${p.toughness} active` : `Toughness ${p.toughness} ignored`}
              aria-pressed=${String(p.toughnessEnabled)}
              aria-label=${p.toughnessEnabled ? `Disable toughness ${p.toughness}` : `Enable toughness ${p.toughness}`}
              @click=${this.handleToughnessToggle}>
              ${shieldIcon}
              <span>${p.toughness}</span>
            </button>
            <button class="btn btn-damage" @click=${this.handleDamage}>Damage</button>
            <button class="btn btn-heal" @click=${this.handleHeal}>Heal</button>
          </div>
        </div>

        <div class="statuses-section">
          ${p.conditions.length > 0
                  ? html`
                      <div class="status-chips-row">
                        ${p.conditions.map(
                          (c) => html`
                            <span class="status-chip">
                              ${c}
                              <button
                                class="status-chip-remove"
                                type="button"
                                title="Remove ${c}"
                                aria-label="Remove status ${c}"
                                @click=${() =>
                                  this.dispatch("participant-remove-condition", { id: p.id, condition: c })}>
                                ×
                              </button>
                            </span>
                          `,
                        )}
                      </div>
                    `
                  : nothing}
          <div class="status-actions-row">
            <div class="status-picker-shell">
              ${this.statusPickerOpen
                ? html`
                    <div class="status-search-wrapper">
                      <input
                        class="status-search-input"
                        type="text"
                        placeholder="Search or create status…"
                        .value=${this.statusQuery}
                        @input=${this.handleStatusInput}
                        @keydown=${this.handleStatusKeyDown}
                        @blur=${this.handleStatusBlur}
                        aria-label="Search statuses"
                        autocomplete="off" />
                      <button
                        class="status-search-cancel"
                        type="button"
                        aria-label="Cancel status search"
                        @click=${this.closeStatusPicker}>
                        ✕
                      </button>
                    </div>
                    <div class="status-results" role="listbox">
                      ${this.statusResults.length === 0 && !this.showCreateOption
                        ? html`
                            <div class="status-empty">
                              ${this.statusQuery.trim()
                                ? `Type a name and press Enter to create "${this.statusQuery.trim()}"`
                                : "No statuses in library yet. Type to create one."}
                            </div>
                          `
                        : nothing}
                      ${this.statusResults.map(
                        (s, i) => html`
                          <button
                            class="status-result ${i === this.statusActiveIndex ? "active" : ""}"
                            role="option"
                            type="button"
                            @mousedown=${(e: Event) => {
                              e.preventDefault();
                              this.selectStatus(s);
                            }}>
                            ${s}
                          </button>
                        `,
                      )}
                      ${this.showCreateOption
                        ? html`
                            <button
                              class="status-result create-new ${this.statusActiveIndex === this.statusResults.length ? "active" : ""}"
                              role="option"
                              type="button"
                              @mousedown=${(e: Event) => {
                                e.preventDefault();
                                this.createAndSelectStatus(this.statusQuery.trim());
                              }}>
                              + Create "${this.statusQuery.trim()}"
                            </button>
                          `
                        : nothing}
                    </div>
                  `
                : html`
                    <button
                      class="status-picker-trigger"
                      type="button"
                      aria-label="Add status to participant"
                      @click=${this.openStatusPicker}>
                      + Add status
                    </button>
                  `}
            </div>
            <button class="notes-toggle" @click=${() => (this.showNotes = !this.showNotes)}>
              ${this.showNotes ? "Hide notes" : `Notes`}
            </button>
          </div>
              </div>

        <div class="notes-section">
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
            <div
              class="overlay"
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-participant-title"
              @keydown=${this.handleModalKeyDown}
              @click=${this.closeEditModal}>
              <div class="modal" @click=${(event: Event) => event.stopPropagation()}>
                <div class="modal-header">
                  <h3 class="modal-title" id="edit-participant-title">Edit Participant</h3>
                </div>
                <div class="modal-form">
                  <label>
                    Name
                    <input
                      id="edit-participant-name"
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
                  <label>
                    Toughness
                    <input
                      type="number"
                      min="0"
                      .value=${this.editToughnessDraft}
                      @input=${(event: Event) => {
                        this.editToughnessDraft = (event.target as HTMLInputElement).value;
                      }} />
                  </label>
                  ${p.type === "monster"
                    ? html`
                        <label>
                          Monster Type
                          <select
                            .value=${this.editMonsterTypeDraft}
                            @change=${(event: Event) => {
                              this.editMonsterTypeDraft = (event.target as HTMLSelectElement).value as MonsterType;
                            }}>
                            <option value="minion">Minion</option>
                            <option value="soldier">Soldier</option>
                            <option value="beast">Beast</option>
                            <option value="brute">Brute</option>
                            <option value="slayer">Slayer</option>
                            <option value="leader">Leader</option>
                            <option value="commander">Commander</option>
                            <option value="behemoth">Behemoth</option>
                          </select>
                        </label>
                      `
                    : nothing}
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
      ${this.statsModalOpen
        ? html`
            <div
              class="overlay"
              role="dialog"
              aria-modal="true"
              aria-labelledby="participant-stats-title"
              @keydown=${this.handleModalKeyDown}
              @click=${this.closeStatsModal}>
              <div class="modal" @click=${(event: Event) => event.stopPropagation()}>
                <div class="modal-header">
                  <h3 class="modal-title" id="participant-stats-title">${p.name} Stats</h3>
                </div>
                <div class="stats-meta">
                  <span class="stats-pill">${p.type === "monster" ? "Monster" : "Player"}</span>
                  ${p.type === "monster" && p.monsterType
                    ? html`
                        <span class="stats-pill">${p.monsterType}</span>
                      `
                    : nothing}
                  ${this.linkedCharacter
                    ? html`
                        <span class="stats-pill">${this.linkedCharacter.race.title}</span>
                        <span class="stats-pill">${this.linkedCharacter.class.title}</span>
                      `
                    : nothing}
                </div>
                ${p.type === "player"
                  ? html`
                      <p class="stats-note">
                        Player participants currently store encounter values and linked character metadata here. Full combat attributes like Skill and Agility are not tracked in the player model yet.
                      </p>
                    `
                  : nothing}
                <div class="stats-grid">
                  ${this.statDetails.map(
                    (stat) => html`
                      <div class="stats-row">
                        <span class="stats-label">${stat.label}</span>
                        <span class="stats-value">${stat.value}</span>
                      </div>
                    `,
                  )}
                </div>
                <div class="modal-actions">
                  <button class="modal-btn primary" type="button" @click=${this.closeStatsModal}>Close</button>
                </div>
              </div>
            </div>
          `
        : nothing}
    `;
  }
}
