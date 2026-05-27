import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { MonsterType, Participant, ParticipantSchema } from "../../shared/type.encounter.js";
import { getMonsterStatsForEncounterLevel } from "../../shared/util.monster-stats.js";
import { MonsterTemplate } from "../../shared/type.monster-template.js";

const DEFAULT_MONSTER_TYPE: MonsterType = "minion";
const DEFAULT_MONSTER_STATS = getMonsterStatsForEncounterLevel(1, DEFAULT_MONSTER_TYPE);

@customElement("encounter-add-form")
export class EncounterAddForm extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
    .form-card {
      background: var(--color-primary-surface-raised, #16162a);
      border: 1px solid rgba(201, 168, 76, 0.15);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .form-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-1, #c9a84c);
      margin: 0 0 1rem;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }
    .row {
      display: flex;
      gap: 0.75rem;
    }
    .row label {
      flex: 1;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--color-primary-text-muted, #8a8780);
    }
    input,
    select {
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
    input:focus,
    select:focus {
      border-color: var(--color-1, #c9a84c);
    }
    .hint {
      font-size: 0.72rem;
      color: var(--color-primary-text-muted, #8a8780);
      margin-top: 1px;
      line-height: 1.4;
    }
    .actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }
    button[type="submit"] {
      padding: 0.6rem 1.5rem;
      background: var(--color-1, #c9a84c);
      color: #1a1a2e;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 200ms ease;
      min-height: 44px;
      touch-action: manipulation;
    }
    button[type="submit"]:hover {
      opacity: 0.88;
    }
    .error {
      color: var(--color-error, #ff6b6b);
      font-size: 0.82rem;
    }
    @media (max-width: 480px) {
      .row {
        flex-direction: column;
      }
      .form-card {
        padding: 0.875rem;
        border-radius: 8px;
      }
    }
  `;

  @state() private name = "";
  @state() private type: "monster" | "player" = "monster";
  @state() private monsterType: MonsterType = DEFAULT_MONSTER_TYPE;
  @state() private initiative = String(DEFAULT_MONSTER_STATS.init);
  @state() private maxHp = String(DEFAULT_MONSTER_STATS.health);
  @state() private selectedTemplateId = "";
  @state() private error: string | null = null;
  @property({ type: Array }) monsterTemplates: MonsterTemplate[] = [];
  @property({ type: Number }) encounterLevel = 1;

  protected override willUpdate(changedProperties: Map<PropertyKey, unknown>): void {
    if ((changedProperties.has("encounterLevel") || changedProperties.has("monsterTemplates")) && this.type === "monster") {
      if (this.selectedTemplateId) {
        const template = this.monsterTemplates.find((item) => item.id === this.selectedTemplateId);
        if (template) {
          this.applyTemplate(template.id);
          return;
        }
        this.selectedTemplateId = "";
      }
      this.applyMonsterTypeDefault(this.monsterType);
    }
  }

  private applyMonsterTypeStats(monsterType: MonsterType): void {
    const stats = getMonsterStatsForEncounterLevel(this.encounterLevel, monsterType);
    this.initiative = String(stats.init);
    this.maxHp = String(stats.health);
  }

  private applyTemplate(templateId: string): void {
    this.selectedTemplateId = templateId;
    const template = this.monsterTemplates.find((item) => item.id === templateId);
    if (!template) {
      this.applyMonsterTypeDefault(this.monsterType);
      return;
    }
    this.type = "monster";
    this.name = template.name;
    this.monsterType = template.monsterType;
    this.initiative = String(template.initiative);
    this.maxHp = String(template.maxHp);
  }

  private applyMonsterTypeDefault(monsterType: MonsterType): void {
    this.monsterType = monsterType;
    this.applyMonsterTypeStats(monsterType);
  }

  private handleSubmit(e: Event) {
    e.preventDefault();
    this.error = null;

    const hp = parseInt(this.maxHp, 10);
    const init = parseInt(this.initiative, 10);

    const candidate = {
      id: crypto.randomUUID(),
      name: this.name.trim(),
      type: this.type,
      monsterType: this.type === "monster" ? this.monsterType : undefined,
      monsterTemplateId: this.type === "monster" && this.selectedTemplateId ? this.selectedTemplateId : undefined,
      initiative: isNaN(init) || init < 1 ? 1 : init > 99 ? 99 : init,
      hp: isNaN(hp) ? 10 : hp,
      maxHp: isNaN(hp) ? 10 : hp,
      notes: "",
      conditions: [],
    };

    const result = ParticipantSchema.safeParse(candidate);
    if (!result.success) {
      this.error = "Please enter a valid name and max HP.";
      return;
    }

    this.dispatchEvent(
      new CustomEvent<Participant>("participant-added", {
        detail: result.data,
        bubbles: true,
        composed: true,
      }),
    );

    this.name = "";
    this.monsterType = DEFAULT_MONSTER_TYPE;
  this.applyMonsterTypeStats(DEFAULT_MONSTER_TYPE);
    this.selectedTemplateId = "";
    (e.target as HTMLFormElement).reset();
  }

  override render() {
    return html`
      <div class="form-card">
        <div class="form-title">Add Participant</div>
        <form @submit=${this.handleSubmit} autocomplete="off">
          <div class="row">
            <label>
              Name
              <input
                name="name"
                .value=${this.name}
                @input=${(e: Event) => (this.name = (e.target as HTMLInputElement).value)}
                placeholder="e.g. Goblin, Fighter"
                required />
            </label>
            <label>
              Type
              <select
                name="type"
                .value=${this.type}
                @change=${(e: Event) => {
                  const nextType = (e.target as HTMLSelectElement).value as "monster" | "player";
                  this.type = nextType;
                  if (nextType === "monster") {
                    this.applyMonsterTypeDefault(this.monsterType);
                  } else {
                    this.selectedTemplateId = "";
                    this.monsterType = DEFAULT_MONSTER_TYPE;
                  }
                }}>
                <option value="monster">Monster</option>
                <option value="player">Player / PC</option>
              </select>
            </label>
            ${this.type === "monster"
              ? html`
                  <label>
                    Template
                    <select
                      name="monsterTemplate"
                      .value=${this.selectedTemplateId}
                      @change=${(e: Event) => this.applyTemplate((e.target as HTMLSelectElement).value)}>
                      <option value="">Custom monster</option>
                      ${this.monsterTemplates.map(
                        (template) => html`
                          <option value=${template.id}>${template.name}</option>
                        `,
                      )}
                    </select>
                  </label>
                `
              : ""}
          </div>
          <div class="row">
            ${this.type === "monster"
              ? html`
                  <label>
                    Monster Type
                    <select
                      name="monsterType"
                      .value=${this.monsterType}
                      @change=${(e: Event) =>
                        this.applyMonsterTypeDefault((e.target as HTMLSelectElement).value as MonsterType)}>
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
              : ""}
            <label>
              Initiative
              <input
                name="initiative"
                type="number"
                min="1"
                max="99"
                step="1"
                .value=${this.initiative}
                @input=${(e: Event) => (this.initiative = (e.target as HTMLInputElement).value)}
                placeholder="1" />
            </label>
            <label>
              Max HP
              <input
                name="maxHp"
                type="number"
                min="1"
                .value=${this.maxHp}
                @input=${(e: Event) => (this.maxHp = (e.target as HTMLInputElement).value)}
                placeholder="10"
                required />
            </label>
          </div>
          ${this.error
            ? html`
                <div class="error">${this.error}</div>
              `
            : ""}
          <div class="actions">
            <button type="submit">+ Add</button>
          </div>
        </form>
      </div>
    `;
  }
}
