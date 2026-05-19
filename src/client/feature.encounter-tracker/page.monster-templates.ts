import { css, html, LitElement, nothing, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { globalStyles } from "../styles.global.js";
import { PROFILE_CHANGED_EVENT } from "../../shared/service.profile.js";
import {
  deleteMonsterTemplate,
  getMonsterTemplates,
  MONSTER_TEMPLATES_CHANGED_EVENT,
  upsertMonsterTemplate,
} from "../../shared/service.monster-templates.js";
import { MonsterTemplate } from "../../shared/type.monster-template.js";
import { MONSTER_TYPE_DEFAULT_INITIATIVE, MonsterType } from "../../shared/type.encounter.js";
import { ENCOUNTERS_CHANGED_EVENT, getEncounter, getEncounters, upsertEncounter } from "../../shared/service.encounters.js";
import { buildMonsterParticipantFromTemplate, syncTemplateMonsterNames } from "../../shared/util.encounter.js";

@customElement("page-monster-templates")
export class PageMonsterTemplates extends LitElement {
  static override styles = [
    globalStyles,
    css`
      .hero {
        display: grid;
        gap: var(--size-medium);
        margin-bottom: var(--size-large);
      }
      .toolbar {
        display: flex;
        gap: var(--size-small);
        flex-wrap: wrap;
        align-items: center;
      }
      .form-card {
        display: grid;
        gap: var(--size-small);
        padding: var(--size-large);
        border: var(--border-normal);
        border-radius: var(--border-radius-medium);
        background: var(--color-primary-surface-raised);
        margin-bottom: var(--size-large);
      }
      .row {
        display: grid;
        gap: var(--size-small);
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .template-list {
        display: grid;
        gap: var(--size-medium);
      }
      .template-card {
        display: grid;
        gap: var(--size-small);
        padding: var(--size-large);
        border: var(--border-normal);
        border-radius: var(--border-radius-medium);
        background: var(--color-primary-surface-raised);
      }
      .template-header {
        display: flex;
        justify-content: space-between;
        gap: var(--size-small);
        align-items: baseline;
        flex-wrap: wrap;
      }
      .template-meta {
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
      }
      .empty {
        color: var(--color-primary-text-muted);
      }
      .feedback {
        color: var(--color-1);
        font-size: var(--font-small);
      }
      @media (max-width: 720px) {
        .row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ];

  @state() private templates: MonsterTemplate[] = [];
  @state() private encounterId = "";
  @state() private feedback: string | null = null;

  @state() private createName = "";
  @state() private createType: MonsterType = "minion";
  @state() private createInitiative = String(MONSTER_TYPE_DEFAULT_INITIATIVE.minion);
  @state() private createMaxHp = "10";
  @state() private createNotes = "";

  @state() private editTemplateId: string | null = null;
  @state() private editName = "";
  @state() private editType: MonsterType = "minion";
  @state() private editInitiative = "1";
  @state() private editMaxHp = "10";
  @state() private editNotes = "";

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncData();
    window.addEventListener(MONSTER_TEMPLATES_CHANGED_EVENT, this.syncData);
    window.addEventListener(ENCOUNTERS_CHANGED_EVENT, this.syncData);
    window.addEventListener(PROFILE_CHANGED_EVENT, this.syncData);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(MONSTER_TEMPLATES_CHANGED_EVENT, this.syncData);
    window.removeEventListener(ENCOUNTERS_CHANGED_EVENT, this.syncData);
    window.removeEventListener(PROFILE_CHANGED_EVENT, this.syncData);
  }

  override render(): TemplateResult {
    const encounters = getEncounters().filter((encounter) => !encounter.archived);

    return html`
      <main>
        <section class="hero">
          <h1>Monster Templates</h1>
          <p>Save reusable monsters and quickly add them to any encounter.</p>
          <div class="toolbar">
            <a class="btn btn-muted" href="/encounters">Back to encounters</a>
          </div>
        </section>

        <section class="form-card">
          <h2>Create template</h2>
          ${this.renderTemplateForm("create")}
          <div class="toolbar">
            <button class="btn btn-primary" type="button" @click=${this.createTemplate}>Save template</button>
          </div>
        </section>

        ${this.feedback
          ? html`
              <p class="feedback">${this.feedback}</p>
            `
          : nothing}

        <section>
          <h2>Saved templates (${this.templates.length})</h2>
          ${this.templates.length === 0
            ? html`
                <p class="empty">No monster templates yet.</p>
              `
            : html`
                <div class="template-list">
                  ${this.templates.map((template) => this.renderTemplateCard(template, encounters))}
                </div>
              `}
        </section>
      </main>
    `;
  }

  private renderTemplateForm(mode: "create" | "edit"): TemplateResult {
    const name = mode === "create" ? this.createName : this.editName;
    const type = mode === "create" ? this.createType : this.editType;
    const initiative = mode === "create" ? this.createInitiative : this.editInitiative;
    const maxHp = mode === "create" ? this.createMaxHp : this.editMaxHp;
    const notes = mode === "create" ? this.createNotes : this.editNotes;

    const setType = (value: MonsterType) => {
      if (mode === "create") {
        this.createType = value;
        this.createInitiative = String(MONSTER_TYPE_DEFAULT_INITIATIVE[value]);
      } else {
        this.editType = value;
        this.editInitiative = String(MONSTER_TYPE_DEFAULT_INITIATIVE[value]);
      }
    };

    return html`
      <div class="row">
        <label>
          Name
          <input
            class="form-input"
            .value=${name}
            @input=${(event: Event) => {
              const value = (event.target as HTMLInputElement).value;
              if (mode === "create") this.createName = value;
              else this.editName = value;
            }} />
        </label>
        <label>
          Monster Type
          <select class="form-input" .value=${type} @change=${(event: Event) => setType((event.target as HTMLSelectElement).value as MonsterType)}>
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
        <label>
          Initiative
          <input
            class="form-input"
            type="number"
            min="1"
            .value=${initiative}
            @input=${(event: Event) => {
              const value = (event.target as HTMLInputElement).value;
              if (mode === "create") this.createInitiative = value;
              else this.editInitiative = value;
            }} />
        </label>
      </div>
      <div class="row">
        <label>
          Max HP
          <input
            class="form-input"
            type="number"
            min="1"
            .value=${maxHp}
            @input=${(event: Event) => {
              const value = (event.target as HTMLInputElement).value;
              if (mode === "create") this.createMaxHp = value;
              else this.editMaxHp = value;
            }} />
        </label>
        <label style="grid-column: span 2;">
          Notes
          <input
            class="form-input"
            .value=${notes}
            @input=${(event: Event) => {
              const value = (event.target as HTMLInputElement).value;
              if (mode === "create") this.createNotes = value;
              else this.editNotes = value;
            }} />
        </label>
      </div>
    `;
  }

  private renderTemplateCard(template: MonsterTemplate, encounters: ReturnType<typeof getEncounters>): TemplateResult {
    const isEditing = this.editTemplateId === template.id;
    return html`
      <article class="template-card">
        <div class="template-header">
          <h3>${template.name}</h3>
          <div class="template-meta">Updated ${new Date(template.updatedAt).toLocaleDateString()}</div>
        </div>
        ${isEditing
          ? html`
              ${this.renderTemplateForm("edit")}
              <div class="toolbar">
                <button class="btn btn-primary" type="button" @click=${() => this.saveTemplateEdit(template)}>Save</button>
                <button class="btn btn-muted" type="button" @click=${this.cancelEdit}>Cancel</button>
              </div>
            `
          : html`
              <div class="template-meta">
                ${template.monsterType} • Init ${template.initiative} • ${template.maxHp} HP
              </div>
              ${template.notes
                ? html`
                    <div class="template-meta">${template.notes}</div>
                  `
                : nothing}
              <div class="toolbar">
                <select class="form-input" .value=${this.encounterId} @change=${this.handleEncounterChange}>
                  <option value="">Select encounter</option>
                  ${encounters.map(
                    (encounter) => html`
                      <option value=${encounter.id}>${encounter.name}</option>
                    `,
                  )}
                </select>
                <button class="btn btn-primary" type="button" @click=${() => this.addTemplateToEncounter(template)}>
                  Add to encounter
                </button>
                <button class="btn btn-muted" type="button" @click=${() => this.startEdit(template)}>Edit</button>
                <button class="btn btn-danger" type="button" @click=${() => this.removeTemplate(template)}>Delete</button>
              </div>
            `}
      </article>
    `;
  }

  private readonly syncData = (): void => {
    this.templates = getMonsterTemplates();
    const encounters = getEncounters().filter((encounter) => !encounter.archived);
    if (!this.encounterId && encounters.length > 0) {
      this.encounterId = encounters[0].id;
    } else if (this.encounterId && !encounters.some((encounter) => encounter.id === this.encounterId)) {
      this.encounterId = encounters[0]?.id ?? "";
    }
  };

  private handleEncounterChange = (event: Event): void => {
    this.encounterId = (event.target as HTMLSelectElement).value;
  };

  private createTemplate = (): void => {
    const name = this.createName.trim();
    const initiative = Math.max(1, parseInt(this.createInitiative, 10) || 1);
    const maxHp = Math.max(1, parseInt(this.createMaxHp, 10) || 1);
    if (!name) return;
    const now = Date.now();
    upsertMonsterTemplate({
      id: crypto.randomUUID(),
      name,
      monsterType: this.createType,
      initiative,
      maxHp,
      notes: this.createNotes.trim(),
      createdAt: now,
      updatedAt: now,
    });
    this.createName = "";
    this.createType = "minion";
    this.createInitiative = String(MONSTER_TYPE_DEFAULT_INITIATIVE.minion);
    this.createMaxHp = "10";
    this.createNotes = "";
    this.feedback = `Saved ${name}.`;
  };

  private addTemplateToEncounter(template: MonsterTemplate): void {
    if (!this.encounterId) {
      this.feedback = "Select an encounter first.";
      return;
    }
    const encounter = getEncounter(this.encounterId);
    if (!encounter) {
      this.feedback = "Encounter not found.";
      return;
    }
    const participant = buildMonsterParticipantFromTemplate(template, encounter.participants);
    const participants = syncTemplateMonsterNames([...encounter.participants, participant], template.id, template.name);
    upsertEncounter({
      ...encounter,
      participants,
      updatedAt: Date.now(),
    });
    this.feedback = `${template.name} added to ${encounter.name}.`;
  }

  private startEdit(template: MonsterTemplate): void {
    this.editTemplateId = template.id;
    this.editName = template.name;
    this.editType = template.monsterType;
    this.editInitiative = String(template.initiative);
    this.editMaxHp = String(template.maxHp);
    this.editNotes = template.notes;
  }

  private cancelEdit = (): void => {
    this.editTemplateId = null;
  };

  private saveTemplateEdit(template: MonsterTemplate): void {
    const name = this.editName.trim();
    const initiative = Math.max(1, parseInt(this.editInitiative, 10) || 1);
    const maxHp = Math.max(1, parseInt(this.editMaxHp, 10) || 1);
    if (!name) return;
    upsertMonsterTemplate({
      ...template,
      name,
      monsterType: this.editType,
      initiative,
      maxHp,
      notes: this.editNotes.trim(),
      updatedAt: Date.now(),
    });
    this.editTemplateId = null;
    this.feedback = `Updated ${name}.`;
  }

  private removeTemplate(template: MonsterTemplate): void {
    if (!confirm(`Delete "${template.name}"?`)) return;
    deleteMonsterTemplate(template.id);
    this.feedback = `Deleted ${template.name}.`;
  }
}
