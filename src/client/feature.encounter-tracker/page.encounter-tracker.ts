import { LitElement, html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { Encounter, EncounterSchema, Participant } from "../../shared/type.encounter.js";
import "./component.encounter-add-form.js";
import "./component.encounter-participant.js";

const STORAGE_KEY = "ha-encounter-tracker";

function newEncounter(): Encounter {
  return {
    id: crypto.randomUUID(),
    name: "New Encounter",
    round: 1,
    currentTurnIndex: 0,
    participants: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
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
    .btn-primary {
      background: var(--color-1, #c9a84c);
      color: #1a1a2e;
    }
    .btn-primary:hover {
      background: #d4b555;
      border-color: #d4b555;
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
    .sort-note {
      font-size: 0.78rem;
      color: var(--color-primary-text-muted, #8a8780);
      margin-bottom: 0.75rem;
    }
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

  /* ---- Encounter controls ---- */

  private handleNameChange(e: Event) {
    this.encounter = { ...this.encounter, name: (e.target as HTMLInputElement).value };
    this.saveEncounter();
  }

  private nextTurn() {
    const len = this.encounter.participants.length;
    if (len === 0) return;
    let next = this.encounter.currentTurnIndex + 1;
    let newRound = this.encounter.round;
    if (next >= len) {
      next = 0;
      newRound = this.encounter.round + 1;
    }
    this.encounter = { ...this.encounter, currentTurnIndex: next, round: newRound };
    this.saveEncounter();
    this.showToast(`Round ${this.encounter.round} — ${this.encounter.participants[next]?.name ?? ""}'s turn`);
  }

  private resetEncounter() {
    if (!confirm("Start a new encounter? This will clear all participants and reset the round counter.")) return;
    this.encounter = newEncounter();
    this.saveEncounter();
    this.showExport = false;
  }

  private sortByInitiative() {
    const sorted = [...this.encounter.participants].sort((a, b) => b.initiative - a.initiative);
    this.encounter = { ...this.encounter, participants: sorted, currentTurnIndex: 0 };
    this.saveEncounter();
    this.showToast("Sorted by initiative");
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
    // Adjust current turn index if needed
    const idx = Math.min(this.encounter.currentTurnIndex, Math.max(0, participants.length - 1));
    this.encounter = { ...this.encounter, participants, currentTurnIndex: idx };
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
    // Keep active turn on same participant
    let newActive = this.encounter.currentTurnIndex;
    if (newActive === idx) newActive = idx - 1;
    else if (newActive === idx - 1) newActive = idx;
    this.encounter = { ...this.encounter, participants: arr, currentTurnIndex: newActive };
    this.saveEncounter();
  }

  private handleMoveDown(e: CustomEvent<{ id: string }>) {
    const idx = this.encounter.participants.findIndex((p) => p.id === e.detail.id);
    if (idx < 0 || idx >= this.encounter.participants.length - 1) return;
    const arr = [...this.encounter.participants];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    let newActive = this.encounter.currentTurnIndex;
    if (newActive === idx) newActive = idx + 1;
    else if (newActive === idx + 1) newActive = idx;
    this.encounter = { ...this.encounter, participants: arr, currentTurnIndex: newActive };
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
    const lines = [
      `Encounter: ${e.name}`,
      `Round: ${e.round}`,
      ``,
      ...e.participants.map(
        (p, i) =>
          `${i === e.currentTurnIndex ? "▶ " : "  "}[${p.type === "monster" ? "M" : "P"}] ${p.name} | Init: ${p.initiative} | HP: ${p.hp}/${p.maxHp}${p.notes ? ` | Notes: ${p.notes}` : ""}`,
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
    const activeIdx = Math.min(enc.currentTurnIndex, enc.participants.length - 1);

    return html`
      <h1>Encounter Tracker</h1>
      <p class="subtitle">
        Track initiative, HP, and turns. Data is saved locally and works offline.
      </p>

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

      <!-- Controls bar -->
      <div class="controls-bar">
        <button
          class="btn btn-primary"
          @click=${this.nextTurn}
          ?disabled=${enc.participants.length === 0}>
          ▶ Next Turn
        </button>
        <button class="btn" @click=${this.sortByInitiative} ?disabled=${enc.participants.length === 0}>
          ↕ Sort by Initiative
        </button>
        <button class="btn btn-muted" @click=${this.toggleTextExport}>
          ${this.showExport ? "Hide Export" : "Export"}
        </button>
        <button class="btn btn-danger" @click=${this.resetEncounter}>New Encounter</button>
      </div>

      <!-- Participants -->
      <div class="section-title">
        Participants (${enc.participants.length})
      </div>
      ${enc.participants.length > 0
        ? html`
            <p class="sort-note">
              Use ▲▼ to reorder or "Sort by Initiative" to auto-sort.
              ${enc.participants.length > 0
                ? html`Active: <strong>${enc.participants[activeIdx]?.name ?? ""}</strong>`
                : ""}
            </p>
          `
        : nothing}

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
                  .isActive=${i === activeIdx}
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
