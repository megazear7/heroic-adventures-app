import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { MonsterType, Participant, ParticipantSchema } from "../../shared/type.encounter.js";
import { stripMonsterCounter } from "../../shared/util.encounter.js";
import { getMonsterStatsForEncounterLevel } from "../../shared/util.monster-stats.js";
import type { MonsterStatsLevelRange } from "../../shared/type.monster-stats.js";
import { MonsterTemplate } from "../../shared/type.monster-template.js";
import { searchIcon } from "../icons.js";

const DEFAULT_MONSTER_TYPE: MonsterType = "minion";
const DEFAULT_MONSTER_STATS = getMonsterStatsForEncounterLevel(1, DEFAULT_MONSTER_TYPE);

type TemplateSource = "default-template" | "custom-template" | "existing-monster";

type TemplatePickerOption = {
  key: string;
  label: string;
  monsterType: MonsterType;
  initiative: number;
  maxHp: number;
  toughness: number;
  source: TemplateSource;
  templateId?: string;
  levelRange?: MonsterStatsLevelRange;
};

type TemplateFilterMode = "default" | "default-templates" | "custom-templates" | "current-monsters" | "all-levels";

type AllLevelDefaultMonsterTemplate = {
  levelRange: MonsterStatsLevelRange;
  template: MonsterTemplate;
};

@customElement("encounter-add-form")
export class EncounterAddForm extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
    .form-card {
      background: var(--color-primary-surface-raised);
      border: 1px solid rgba(201, 168, 76, 0.15);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: var(--size-lg);
    }
    .form-title {
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--color-1);
      margin: 0 0 var(--size-md);
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
      gap: var(--size-xs);
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--color-primary-text-muted);
    }
    input,
    select {
      font-size: 0.95rem;
      font-family: var(--font-family);
      padding: var(--size-sm) 0.75rem;
      border-radius: 6px;
      border: 1px solid rgba(201, 168, 76, 0.2);
      background: var(--color-primary-surface-overlay);
      color: var(--color-primary-text);
      outline: none;
      transition: border-color 200ms ease;
      width: 100%;
      box-sizing: border-box;
    }
    input:focus,
    select:focus {
      border-color: var(--color-1);
    }
    .hint {
      font-size: 0.72rem;
      color: var(--color-primary-text-muted);
      margin-top: 1px;
      line-height: 1.4;
    }
    .template-picker-shell {
      position: relative;
    }
    .template-search-wrapper {
      display: flex;
      align-items: center;
      gap: var(--size-sm);
      border: 1px solid rgba(201, 168, 76, 0.2);
      background: var(--color-primary-surface-overlay);
      border-radius: 6px;
      padding: 0 0.75rem;
    }
    .template-search-wrapper:focus-within {
      border-color: var(--color-1);
    }
    .template-filter-row {
      display: flex;
      gap: 0.4rem;
      padding: 0.6rem;
      border-bottom: 1px solid rgba(201, 168, 76, 0.12);
      overflow-x: auto;
    }
    .template-filter-btn {
      border: 1px solid rgba(201, 168, 76, 0.2);
      background: rgba(201, 168, 76, 0.04);
      color: var(--color-primary-text-muted);
      border-radius: 999px;
      padding: 0.3rem 0.7rem;
      font: inherit;
      font-size: 0.72rem;
      white-space: nowrap;
      cursor: pointer;
    }
    .template-filter-btn.active {
      color: var(--color-1);
      border-color: rgba(201, 168, 76, 0.35);
      background: rgba(201, 168, 76, 0.12);
    }
    .template-search-icon {
      color: var(--color-primary-text-muted);
      display: inline-flex;
      align-items: center;
    }
    .template-search-icon svg {
      width: 16px;
      height: 16px;
    }
    .template-search-input {
      border: none;
      background: transparent;
      padding: var(--size-sm) 0;
      border-radius: 0;
    }
    .template-search-input:focus {
      border-color: transparent;
    }
    .template-results {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      z-index: 10;
      border: 1px solid rgba(201, 168, 76, 0.2);
      border-radius: 8px;
      background: var(--color-primary-surface-raised);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
      overflow: hidden;
      max-height: 240px;
      overflow-y: auto;
    }
    .template-result,
    .template-empty {
      width: 100%;
      text-align: left;
      border: none;
      background: none;
      color: var(--color-primary-text);
      padding: 0.65rem 0.75rem;
      font: inherit;
      font-size: 0.85rem;
      display: block;
      box-sizing: border-box;
    }
    .template-result {
      cursor: pointer;
    }
    .template-result:hover,
    .template-result.active {
      background: rgba(201, 168, 76, 0.08);
    }
    .template-result-title {
      font-weight: 600;
    }
    .template-result-meta {
      margin-top: 0.15rem;
      color: var(--color-primary-text-muted);
      font-size: 0.75rem;
    }
    .template-result-source {
      display: inline-flex;
      align-items: center;
      margin-right: 0.45rem;
      color: var(--color-primary-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 0.65rem;
      font-weight: 700;
    }
    .template-empty {
      color: var(--color-primary-text-muted);
      cursor: default;
    }
    .actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }
    button[type="submit"] {
      padding: 0.6rem var(--size-lg);
      background: var(--color-1);
      color: var(--color-secondary-surface);
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
      color: var(--color-error);
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
  @state() private toughness = "0";
  @state() private selectedTemplateId = "";
  @state() private selectedTemplateOptionKey = "";
  @state() private templateQuery = "";
  @state() private templatePickerOpen = false;
  @state() private templateActiveIndex = -1;
  @state() private templateFilter: TemplateFilterMode = "default";
  @state() private error: string | null = null;
  @property({ type: Array }) defaultMonsterTemplates: MonsterTemplate[] = [];
  @property({ type: Array }) customMonsterTemplates: MonsterTemplate[] = [];
  @property({ type: Array }) currentMonsters: Participant[] = [];
  @property({ type: Array }) allLevelDefaultMonsterTemplates: AllLevelDefaultMonsterTemplate[] = [];
  @property({ type: Number }) encounterLevel = 1;

  protected override willUpdate(changedProperties: Map<PropertyKey, unknown>): void {
    if (
      (changedProperties.has("encounterLevel") ||
        changedProperties.has("defaultMonsterTemplates") ||
        changedProperties.has("customMonsterTemplates") ||
        changedProperties.has("currentMonsters") ||
        changedProperties.has("allLevelDefaultMonsterTemplates")) &&
      this.type === "monster"
    ) {
      if (this.selectedTemplateOptionKey) {
        const option = this.templateOptions.find((item) => item.key === this.selectedTemplateOptionKey);
        if (option) {
          this.applyTemplateOption(option);
          return;
        }
        this.selectedTemplateOptionKey = "";
        this.selectedTemplateId = "";
      }
      this.applyMonsterTypeDefault(this.monsterType);
    }
  }

  private get templateOptions(): TemplatePickerOption[] {
    const defaultOptions = this.defaultMonsterTemplates.map<TemplatePickerOption>((template) => ({
      key: `default:${template.id}`,
      label: template.name,
      monsterType: template.monsterType,
      initiative: template.initiative,
      maxHp: template.maxHp,
      toughness: getMonsterStatsForEncounterLevel(this.encounterLevel, template.monsterType).tough,
      source: "default-template",
      templateId: template.id,
    }));

    const customOptions = this.customMonsterTemplates.map<TemplatePickerOption>((template) => ({
      key: `custom:${template.id}`,
      label: template.name,
      monsterType: template.monsterType,
      initiative: template.initiative,
      maxHp: template.maxHp,
      toughness: getMonsterStatsForEncounterLevel(this.encounterLevel, template.monsterType).tough,
      source: "custom-template",
      templateId: template.id,
    }));

    const existingByName = new Map<string, TemplatePickerOption>();
    for (const participant of this.currentMonsters) {
      if (participant.type !== "monster" || !participant.monsterType) {
        continue;
      }
      const label = stripMonsterCounter(participant.name);
      const key = label.toLocaleLowerCase();
      if (existingByName.has(key)) {
        continue;
      }
      existingByName.set(key, {
        key: `existing:${key}`,
        label,
        monsterType: participant.monsterType,
        initiative: participant.initiative,
        maxHp: participant.maxHp,
        toughness: participant.toughness,
        source: "existing-monster",
      });
    }

    const allLevelDefaultOptions = this.allLevelDefaultMonsterTemplates.map<TemplatePickerOption>(({ levelRange, template }) => ({
      key: `all-levels:${levelRange}:${template.id}`,
      label: template.name,
      monsterType: template.monsterType,
      initiative: template.initiative,
      maxHp: template.maxHp,
      toughness: getMonsterStatsForEncounterLevel(this.levelRangeStart(levelRange), template.monsterType).tough,
      source: "default-template",
      templateId: template.id,
      levelRange,
    }));

    switch (this.templateFilter) {
      case "default-templates":
        return defaultOptions;
      case "custom-templates":
        return customOptions;
      case "current-monsters":
        return [...existingByName.values()];
      case "all-levels":
        return allLevelDefaultOptions;
      case "default":
      default:
        return [...defaultOptions, ...customOptions, ...existingByName.values()];
    }
  }

  private get templateResults(): TemplatePickerOption[] {
    const query = this.templateQuery.trim().toLowerCase();
    if (!query) {
      return this.templateOptions;
    }

    return this.templateOptions.filter((option) => {
      const haystack = `${option.label} ${option.monsterType} ${this.templateSourceLabel(option.source)}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  private templateSourceLabel(source: TemplateSource): string {
    switch (source) {
      case "default-template":
        return "Default template";
      case "custom-template":
        return "Custom template";
      case "existing-monster":
        return "Existing monster";
    }
  }

  private templateFilterLabel(filter: TemplateFilterMode): string {
    switch (filter) {
      case "default":
        return "Default";
      case "default-templates":
        return "Default templates";
      case "custom-templates":
        return "Custom templates";
      case "current-monsters":
        return "Current monsters";
      case "all-levels":
        return "All levels";
    }
  }

  private levelRangeLabel(levelRange: MonsterStatsLevelRange): string {
    const [start, end] = levelRange.replace("levels_", "").split("_");
    return `Levels ${start}-${end}`;
  }

  private levelRangeStart(levelRange: MonsterStatsLevelRange): number {
    const [start] = levelRange.replace("levels_", "").split("_");
    return parseInt(start, 10);
  }

  private applyMonsterTypeStats(monsterType: MonsterType): void {
    const stats = getMonsterStatsForEncounterLevel(this.encounterLevel, monsterType);
    this.initiative = String(stats.init);
    this.maxHp = String(stats.health);
    this.toughness = String(stats.tough);
  }

  private applyTemplateOption(option: TemplatePickerOption): void {
    this.selectedTemplateId = option.templateId ?? "";
    this.selectedTemplateOptionKey = option.key;
    this.type = "monster";
    this.templateQuery = option.label;
    this.name = option.label;
    this.monsterType = option.monsterType;
    this.initiative = String(option.initiative);
    this.maxHp = String(option.maxHp);
    this.toughness = String(option.toughness);
  }

  private applyMonsterTypeDefault(monsterType: MonsterType): void {
    this.monsterType = monsterType;
    this.applyMonsterTypeStats(monsterType);
  }

  private handleTemplateInput = (event: Event): void => {
    this.templateQuery = (event.target as HTMLInputElement).value;
    this.templatePickerOpen = true;
    this.templateActiveIndex = -1;
    if (this.selectedTemplateOptionKey) {
      const selectedOption = this.templateOptions.find((item) => item.key === this.selectedTemplateOptionKey);
      if (selectedOption && selectedOption.label !== this.templateQuery) {
        this.selectedTemplateId = "";
        this.selectedTemplateOptionKey = "";
      }
    }
  };

  private handleTemplateFocus = (): void => {
    this.templatePickerOpen = true;
  };

  private setTemplateFilter(filter: TemplateFilterMode): void {
    this.templateFilter = filter;
    this.templateActiveIndex = -1;
  }

  private handleTemplateBlur = (event: FocusEvent): void => {
    const shell = this.renderRoot.querySelector(".template-picker-shell");
    const nextTarget = event.relatedTarget as Node | null;
    if (shell && nextTarget && shell.contains(nextTarget)) {
      return;
    }
    this.templatePickerOpen = false;
    this.templateActiveIndex = -1;
  };

  private handleTemplateKeyDown = (event: KeyboardEvent): void => {
    if (!this.templatePickerOpen && ["ArrowDown", "ArrowUp"].includes(event.key)) {
      this.templatePickerOpen = true;
    }

    const totalItems = this.templateResults.length + 1;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.templateActiveIndex = Math.min(this.templateActiveIndex + 1, totalItems - 1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      this.templateActiveIndex = Math.max(this.templateActiveIndex - 1, -1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (this.templateActiveIndex === 0) {
        this.selectCustomMonster();
      } else if (this.templateActiveIndex > 0) {
        this.selectTemplate(this.templateResults[this.templateActiveIndex - 1]);
      } else if (this.templateResults.length === 1) {
        this.selectTemplate(this.templateResults[0]);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      this.templatePickerOpen = false;
      this.templateActiveIndex = -1;
    }
  };

  private selectCustomMonster(): void {
    this.selectedTemplateId = "";
    this.selectedTemplateOptionKey = "";
    this.templateQuery = "";
    this.applyMonsterTypeDefault(this.monsterType);
    this.templatePickerOpen = false;
    this.templateActiveIndex = -1;
  }

  private selectTemplate(option: TemplatePickerOption): void {
    this.applyTemplateOption(option);
    this.templatePickerOpen = false;
    this.templateActiveIndex = -1;
  }

  private handleSubmit(e: Event) {
    e.preventDefault();
    this.error = null;

    const hp = parseInt(this.maxHp, 10);
    const init = parseInt(this.initiative, 10);
    const toughness = parseInt(this.toughness, 10);

    const candidate = {
      id: crypto.randomUUID(),
      name: this.name.trim(),
      type: this.type,
      monsterType: this.type === "monster" ? this.monsterType : undefined,
      monsterTemplateId: this.type === "monster" && this.selectedTemplateId ? this.selectedTemplateId : undefined,
      initiative: isNaN(init) || init < 1 ? 1 : init > 99 ? 99 : init,
      hp: isNaN(hp) ? 10 : hp,
      maxHp: isNaN(hp) ? 10 : hp,
      toughness: isNaN(toughness) || toughness < 0 ? 0 : toughness,
      toughnessEnabled: true,
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
    this.toughness = "0";
    this.selectedTemplateId = "";
    this.selectedTemplateOptionKey = "";
    this.templateQuery = "";
    this.templatePickerOpen = false;
    this.templateActiveIndex = -1;
    this.templateFilter = "default";
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
                    <div class="template-picker-shell">
                      <div class="template-search-wrapper">
                        <span class="template-search-icon">${searchIcon}</span>
                        <input
                          class="template-search-input"
                          type="text"
                          .value=${this.templateQuery}
                          placeholder="Search templates or choose custom"
                          @input=${this.handleTemplateInput}
                          @keydown=${this.handleTemplateKeyDown}
                          @focus=${this.handleTemplateFocus}
                          @blur=${this.handleTemplateBlur}
                          autocomplete="off"
                          aria-label="Search monster templates" />
                      </div>
                      ${this.templatePickerOpen
                        ? html`
                            <div class="template-results" role="listbox">
                              <div class="template-filter-row">
                                ${(
                                  [
                                    "default",
                                    "default-templates",
                                    "custom-templates",
                                    "current-monsters",
                                    "all-levels",
                                  ] as TemplateFilterMode[]
                                ).map(
                                  (filter) => html`
                                    <button
                                      class="template-filter-btn ${this.templateFilter === filter ? "active" : ""}"
                                      type="button"
                                      @mousedown=${(event: Event) => {
                                        event.preventDefault();
                                        this.setTemplateFilter(filter);
                                      }}>
                                      ${this.templateFilterLabel(filter)}
                                    </button>
                                  `,
                                )}
                              </div>
                              <button
                                class="template-result ${this.templateActiveIndex === 0 ? "active" : ""}"
                                type="button"
                                @mousedown=${(event: Event) => {
                                  event.preventDefault();
                                  this.selectCustomMonster();
                                }}>
                                <div class="template-result-title">Custom monster</div>
                                <div class="template-result-meta">Use manual monster type and stats</div>
                              </button>
                              ${this.templateResults.length === 0
                                ? html`
                                    <div class="template-empty">No matching templates.</div>
                                  `
                                : this.templateResults.map(
                                    (option, index) => html`
                                      <button
                                        class="template-result ${this.templateActiveIndex === index + 1 ? "active" : ""}"
                                        type="button"
                                        @mousedown=${(event: Event) => {
                                          event.preventDefault();
                                          this.selectTemplate(option);
                                        }}>
                                        <div class="template-result-title">${option.label}</div>
                                        <div class="template-result-meta">
                                          <span class="template-result-source">${this.templateSourceLabel(option.source)}</span>
                                          ${option.levelRange
                                            ? html`
                                                <span class="template-result-source">${this.levelRangeLabel(option.levelRange)}</span>
                                              `
                                            : ""}
                                          ${option.monsterType} • ${option.initiative} initiative • ${option.maxHp} HP • ${option.toughness} toughness
                                        </div>
                                      </button>
                                    `,
                                  )}
                            </div>
                          `
                        : ""}
                    </div>
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
            <label>
              Toughness
              <input
                name="toughness"
                type="number"
                min="0"
                .value=${this.toughness}
                @input=${(e: Event) => (this.toughness = (e.target as HTMLInputElement).value)}
                placeholder="0" />
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
