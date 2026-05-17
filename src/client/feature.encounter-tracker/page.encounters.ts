import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { globalStyles } from "../styles.global.js";
import { PROFILE_CHANGED_EVENT } from "../../shared/service.profile.js";
import { Encounter } from "../../shared/type.encounter.js";
import {
  ENCOUNTERS_CHANGED_EVENT,
  getEncounters,
  deleteEncounter,
  duplicateEncounter,
  setEncounterArchived,
} from "../../shared/service.encounters.js";

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

@customElement("page-encounters")
export class PageEncounters extends LitElement {
  static override styles = [
    globalStyles,
    css`
      .hero {
        display: grid;
        gap: var(--size-large);
        margin-bottom: var(--size-large);
        padding: clamp(20px, 4vw, 32px);
        background:
          radial-gradient(circle at top right, rgba(201, 168, 76, 0.18), transparent 35%),
          linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(201, 168, 76, 0.03));
        border: var(--border-normal);
        border-radius: var(--border-radius-large);
      }

      .hero-copy p {
        margin: 0;
        color: var(--color-primary-text-muted);
      }

      .hero-actions {
        display: flex;
        gap: var(--size-small);
        flex-wrap: wrap;
        align-items: center;
      }

      .hero-stat {
        padding: 10px 12px;
        border-radius: 999px;
        border: var(--border-normal);
        background: rgba(255, 255, 255, 0.02);
        font-size: var(--font-small);
        color: var(--color-primary-text-muted);
      }

      .encounters-list {
        display: grid;
        gap: var(--size-medium);
      }

      .encounter-card {
        display: grid;
        gap: var(--size-small);
        padding: var(--size-large);
        background: var(--color-primary-surface-raised);
        border: var(--border-normal);
        border-radius: var(--border-radius-medium);
        transition: border-color var(--time-fast) ease;
      }

      .encounter-card:hover {
        border-color: rgba(201, 168, 76, 0.35);
      }

      .encounter-card-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: var(--size-medium);
        flex-wrap: wrap;
      }

      .encounter-name {
        font-size: var(--font-medium);
        font-weight: 700;
        color: var(--color-primary-text-bold);
        margin: 0;
      }

      .encounter-meta {
        display: flex;
        gap: var(--size-small);
        flex-wrap: wrap;
        align-items: center;
        font-size: var(--font-small);
        color: var(--color-primary-text-muted);
      }

      .meta-badge {
        padding: 3px 10px;
        border-radius: 999px;
        border: var(--border-normal);
        background: rgba(255, 255, 255, 0.02);
        font-size: var(--font-tiny);
      }

      .encounter-actions {
        display: flex;
        gap: var(--size-small);
        flex-wrap: wrap;
        margin-top: var(--size-small);
      }

      .empty {
        padding: var(--size-large);
        border: var(--border-normal);
        border-radius: var(--border-radius-medium);
        color: var(--color-primary-text-muted);
        text-align: center;
      }

      .btn-muted {
        border-color: rgba(138, 135, 128, 0.3);
        color: var(--color-primary-text-muted);
      }

      .btn-muted:hover {
        background: rgba(138, 135, 128, 0.1);
        color: var(--color-primary-text);
      }

      .btn-danger {
        border-color: rgba(255, 100, 100, 0.5);
        color: #ff8888;
      }

      .btn-danger:hover {
        background: rgba(255, 100, 100, 0.15);
        color: #ff8888;
      }
    `,
  ];

  @state() private encounters: Encounter[] = [];
  @state() private showArchived = false;

  private readonly syncEncounters = (): void => {
    this.encounters = getEncounters();
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncEncounters();
    window.addEventListener(ENCOUNTERS_CHANGED_EVENT, this.syncEncounters);
    window.addEventListener(PROFILE_CHANGED_EVENT, this.syncEncounters);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(ENCOUNTERS_CHANGED_EVENT, this.syncEncounters);
    window.removeEventListener(PROFILE_CHANGED_EVENT, this.syncEncounters);
  }

  override render(): TemplateResult {
    const activeEncounters = this.encounters.filter((encounter) => !encounter.archived);
    const archivedEncounters = this.encounters.filter((encounter) => encounter.archived);
    const visibleEncounters = this.showArchived ? this.encounters : activeEncounters;

    return html`
      <main>
        <section class="hero">
          <div class="hero-copy">
            <h1>Encounters</h1>
            <p>Prep, run, pause, and resume encounters. Each encounter auto-saves as you make changes.</p>
          </div>
          <div class="hero-actions">
            <div class="hero-stat">
              ${activeEncounters.length} active ${activeEncounters.length === 1 ? "encounter" : "encounters"}
            </div>
            ${archivedEncounters.length > 0
              ? html`
                  <button class="btn btn-muted" type="button" @click=${this.toggleArchived}>
                    ${this.showArchived ? "Hide archived" : `Show archived (${archivedEncounters.length})`}
                  </button>
                `
              : ""}
            <a class="btn btn-primary" href="/encounter/create">New Encounter</a>
          </div>
        </section>

        ${visibleEncounters.length === 0
          ? html`
              <div class="empty">
                ${this.encounters.length === 0
                  ? "No encounters yet. Create one to get started."
                  : "No active encounters. Show archived to restore one."}
              </div>
            `
          : html`
              <div class="encounters-list">${visibleEncounters.map((enc) => this.renderEncounterCard(enc))}</div>
            `}
      </main>
    `;
  }

  private renderEncounterCard(enc: Encounter): TemplateResult {
    return html`
      <div class="encounter-card">
        <div class="encounter-card-header">
          <div class="encounter-name">${enc.name}</div>
          <div class="encounter-meta">
            <span class="meta-badge">Level ${enc.level}</span>
            <span class="meta-badge">Round ${enc.round}</span>
            <span class="meta-badge">
              ${enc.participants.length} participant${enc.participants.length === 1 ? "" : "s"}
            </span>
            ${enc.archived
              ? html`
                  <span class="meta-badge">Archived</span>
                `
              : ""}
            <span>Updated ${formatDate(enc.updatedAt)}</span>
          </div>
        </div>
        <div class="encounter-actions">
          <a class="btn btn-primary" href="/encounter/${enc.id}">Resume</a>
          <button class="btn btn-muted" @click=${() => this.handleDuplicate(enc)}>Duplicate</button>
          <button class="btn btn-muted" @click=${() => this.handleToggleArchive(enc)}>
            ${enc.archived ? "Restore" : "Archive"}
          </button>
          <button class="btn btn-danger" @click=${() => this.handleDelete(enc)}>Delete</button>
        </div>
      </div>
    `;
  }

  private handleDuplicate(enc: Encounter): void {
    const copy = duplicateEncounter(enc);
    this.dispatchEvent(
      new CustomEvent("NavigationEvent", {
        detail: { path: `/encounter/${copy.id}` },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleDelete(enc: Encounter): void {
    if (!confirm(`Delete "${enc.name}"? This cannot be undone.`)) return;
    deleteEncounter(enc.id);
  }

  private handleToggleArchive(enc: Encounter): void {
    setEncounterArchived(enc.id, !enc.archived);
  }

  private toggleArchived = (): void => {
    this.showArchived = !this.showArchived;
  };
}
