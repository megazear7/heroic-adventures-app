import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { globalStyles } from "../styles.global.js";
import { loadSearchIndex, SearchIndexedEntry } from "../service.search.js";
import {
  Character,
  CharacterContentLink,
  CharacterSchema,
  DEFAULT_CHARACTER_HEALTH,
  DEFAULT_CHARACTER_STAT_VALUE,
  DEFAULT_CHARACTER_INITIATIVE,
  DEFAULT_CHARACTER_WEAPON_TRAINING,
  CharacterWeaponTraining,
  WEAPON_TRAINING_TYPES,
  WeaponTrainingType,
} from "../../shared/type.character.js";
import { clearCharacterDraft, getCharacterDraft, saveCharacterDraft } from "../../shared/service.characters.js";
import "./component.character-entry-picker.js";
import "./component.character-linked-entry-card.js";

const STEPS = ["Identity", "Stats", "Build", "Review"] as const;

const CHARACTER_NAME_PLACEHOLDERS = [
  "Aldren of the White Peaks",
  "Mira Ashvale",
  "Torren Vale",
  "Selka Dawnmere",
  "Bram Thistleford",
  "Ilya Stonewake",
  "Corin Emberfall",
  "Nessa Hollowbrook",
  "Varric Moonfen",
  "Liora Greenbloom",
  "Garron Pike",
  "Talia Mistwood",
  "Fenric Blackmere",
  "Sable Hart",
  "Orin Glass",
  "Kaela Starling",
  "Doran Ashmark",
  "Ysolde Bracken",
  "Perrin Flint",
  "Maelis Wintermere",
  "Rook Halden",
  "Celine Thorn",
  "Jorren Wildbrook",
  "Aeris Valecrest",
  "Thorne Redfield",
  "Isolde Ravenna",
  "Cassian Drift",
  "Brina Moss",
  "Eldric Crowe",
  "Nyra Silverfen",
  "Tobin Crest",
  "Vaela Stormrest",
  "Hadrian Pike",
  "Kestrel Dune",
  "Maren Foxglove",
  "Lucan Evermarch",
  "Sera Whitlock",
  "Bodin Reef",
  "Elira Dawnfall",
  "Ronan Vex",
  "Tamsin Holloway",
  "Cedric Valeborn",
  "Lyra Moorwind",
  "Hale Ironwood",
  "Eira Snowmere",
  "Quill Fenwick",
  "Alina Frost",
  "Dain Willow",
  "Mira Thornfield",
  "Vesper Locke",
  "Arlen Greybriar",
  "Sorin Highwater",
  "Nyla Cinder",
  "Bren Oakheart",
  "Talin Wren",
  "Keira Blackstone",
  "Rowan Duskwell",
  "Calista Reed",
  "Dorian Westmere",
  "Asha Winterthorn",
  "Leoric Pine",
  "Sera Moonlake",
  "Torin Ashdown",
  "Velda Rain",
  "Corwen Bright",
  "Nerys Flintvale",
  "Gideon Marsh",
  "Faye Alder",
  "Magnus Thornkeep",
  "Lena Starfall",
  "Orrin Deepwell",
  "Sylvi Ember",
  "Tristan Vell",
  "Maeve Briar",
  "Evander Holt",
  "Rhea Sunmere",
  "Galen Mist",
  "Petra Goldfern",
  "Darian Frostvale",
  "Iris Hollow",
  "Bastian Crownhill",
  "Lenora Swift",
  "Cael Runebrook",
  "Mila Thornwild",
  "Jasper Mire",
  "Odette Vale",
  "Riven Skye",
  "Anwen Stonebrook",
  "Theron Gale",
  "Junia Redleaf",
  "Alaric Emberstone",
  "Poppy Marshglow",
  "Cyrus Nightwell",
  "Elowen Pike",
  "Kellan Frostbrook",
  "Vita Cloudmere",
  "Orla Fen",
  "Remy Thornvale",
  "Lucia Starcrest",
  "Harkin Driftwood",
] as const;

const CHARACTER_STAT_FIELDS = [
  { key: "health", label: "Health", min: 1 },
  { key: "skill", label: "Skill", min: 0 },
  { key: "agility", label: "Agility", min: 0 },
  { key: "aim", label: "Aim", min: 0 },
  { key: "tactics", label: "Tactics", min: 0 },
  { key: "intelligence", label: "Intelligence", min: 0 },
  { key: "willpower", label: "Willpower", min: 0 },
  { key: "strength", label: "Strength", min: 0 },
  { key: "initiative", label: "Initiative", min: 0 },
] as const;

const PRIMARY_STAT_FIELDS = CHARACTER_STAT_FIELDS.slice(1, 5);
const SECONDARY_STAT_FIELDS = CHARACTER_STAT_FIELDS.slice(5);

type CharacterNumericField = (typeof CHARACTER_STAT_FIELDS)[number]["key"];

type CharacterDraft = {
  name: string;
  health: number;
  skill: number;
  agility: number;
  aim: number;
  tactics: number;
  intelligence: number;
  willpower: number;
  strength: number;
  initiative: number;
  weaponTraining: CharacterWeaponTraining;
  race?: CharacterContentLink;
  class?: CharacterContentLink;
  background?: CharacterContentLink;
  flaw?: CharacterContentLink;
  spells: CharacterContentLink[];
  features: CharacterContentLink[];
  feats: CharacterContentLink[];
  expertise: CharacterContentLink[];
  gear: CharacterContentLink[];
};

function createEmptyDraft(): CharacterDraft {
  return {
    name: "",
    health: DEFAULT_CHARACTER_HEALTH,
    skill: DEFAULT_CHARACTER_STAT_VALUE,
    agility: DEFAULT_CHARACTER_STAT_VALUE,
    aim: DEFAULT_CHARACTER_STAT_VALUE,
    tactics: DEFAULT_CHARACTER_STAT_VALUE,
    intelligence: DEFAULT_CHARACTER_STAT_VALUE,
    willpower: DEFAULT_CHARACTER_STAT_VALUE,
    strength: DEFAULT_CHARACTER_STAT_VALUE,
    initiative: DEFAULT_CHARACTER_INITIATIVE,
    weaponTraining: { ...DEFAULT_CHARACTER_WEAPON_TRAINING },
    spells: [],
    features: [],
    feats: [],
    expertise: [],
    gear: [],
  };
}

function pickRandomCharacterNamePlaceholder(): string {
  const index = Math.floor(Math.random() * CHARACTER_NAME_PLACEHOLDERS.length);
  return CHARACTER_NAME_PLACEHOLDERS[index] ?? "Aldren of the White Peaks";
}

@customElement("character-create-form")
export class CharacterCreateForm extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        display: block;
      }

      form {
        display: flex;
        flex-direction: column;
        gap: var(--size-large);
      }

      .intro {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: var(--size-medium);
        flex-wrap: wrap;
      }

      .intro p {
        margin: 0;
        max-width: 56ch;
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
      }

      .step-tabs {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: var(--size-small);
      }

      .step-tab {
        padding: 10px 12px;
        border-radius: var(--border-radius-small);
        border: var(--border-normal);
        background: rgba(255, 255, 255, 0.02);
        color: var(--color-primary-text-muted);
        cursor: pointer;
        text-align: left;
        transition: var(--transition-fast);
      }

      .step-tab strong {
        display: block;
        color: inherit;
        font-size: var(--font-small);
      }

      .step-tab span {
        font-size: var(--font-tiny);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .step-tab.active {
        border-color: rgba(201, 168, 76, 0.45);
        background: rgba(201, 168, 76, 0.1);
        color: var(--color-primary-text);
      }

      .step-tab:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      .step-panel {
        display: grid;
        gap: var(--size-large);
      }

      .step-header p {
        margin: 0;
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
      }

      .name-field {
        display: grid;
        gap: var(--size-small);
      }

      .name-field label {
        font-size: var(--font-small);
        font-weight: 600;
      }

      .name-field input,
      .summary-input {
        width: 100%;
        box-sizing: border-box;
        padding: 12px 14px;
        border-radius: var(--border-radius-small);
        border: var(--border-normal);
        background: var(--color-primary-surface-raised);
        color: var(--color-primary-text);
        font-size: var(--font-medium);
        font-family: var(--font-family);
      }

      .grid {
        display: grid;
        gap: var(--size-large);
      }

      .grid.two-up {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .stats-layout {
        display: grid;
        gap: var(--size-medium);
      }

      .stats-grid {
        display: grid;
        gap: var(--size-medium);
      }

      .stats-grid.single {
        grid-template-columns: minmax(0, 220px);
      }

      .stats-grid.four-up {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .stat-field {
        display: grid;
        gap: var(--size-small);
      }

      .stat-field label,
      .weapon-training-row label {
        font-size: var(--font-small);
        font-weight: 600;
      }

      .stat-field input {
        width: 100%;
        box-sizing: border-box;
        padding: 12px 14px;
        border-radius: var(--border-radius-small);
        border: var(--border-normal);
        background: var(--color-primary-surface-raised);
        color: var(--color-primary-text);
        font-size: var(--font-medium);
        font-family: var(--font-family);
      }

      .weapon-training {
        display: grid;
        gap: var(--size-medium);
      }

      .weapon-training-grid {
        display: grid;
        gap: var(--size-medium);
      }

      .weapon-training-row {
        display: grid;
        grid-template-columns: minmax(100px, 140px) 1fr;
        gap: var(--size-medium);
        align-items: center;
      }

      .bubble-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .bubble-button {
        width: 34px;
        height: 34px;
        border-radius: 999px;
        border: 1px solid rgba(201, 168, 76, 0.28);
        background: rgba(255, 255, 255, 0.02);
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
        font-weight: 700;
        cursor: pointer;
        transition: var(--transition-fast);
      }

      .bubble-button.active {
        background: rgba(201, 168, 76, 0.18);
        border-color: rgba(201, 168, 76, 0.52);
        color: var(--color-primary-text);
      }

      .bubble-button:hover,
      .bubble-button:focus-visible {
        border-color: rgba(201, 168, 76, 0.52);
        color: var(--color-primary-text);
        outline: none;
      }

      .summary-grid {
        display: grid;
        gap: var(--size-medium);
      }

      .summary-group {
        display: grid;
        gap: var(--size-small);
      }

      .summary-group h3 {
        margin-bottom: 0;
      }

      .selected-grid {
        display: grid;
        gap: var(--size-small);
      }

      .status-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--size-medium);
        flex-wrap: wrap;
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
      }

      .error {
        color: var(--color-error);
        font-size: var(--font-small);
      }

      .actions {
        display: flex;
        gap: var(--size-small);
        flex-wrap: wrap;
      }

      .actions .spacer {
        flex: 1;
      }

      .loading {
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
      }

      @media (max-width: 800px) {
        .grid.two-up,
        .step-tabs,
        .stats-grid.four-up,
        .stats-grid.single {
          grid-template-columns: 1fr;
        }
      }
    `,
  ];

  @state() private catalog: SearchIndexedEntry[] = [];
  @state() private form: CharacterDraft = createEmptyDraft();
  @state() private error: string | null = null;
  @state() private step = 0;
  @state() private loadingCatalog = true;
  @state() private namePlaceholder = pickRandomCharacterNamePlaceholder();

  override connectedCallback(): void {
    super.connectedCallback();
    this.namePlaceholder = pickRandomCharacterNamePlaceholder();
    this.loadDraft();
    void this.loadCatalog();
  }

  override render(): TemplateResult {
    return html`
      <form @submit=${this.handleSubmit} autocomplete="off">
        <div class="intro">
          <p>
            Selections come from your live content library, autosave by profile, and stay linked back to the original
            rules entries.
          </p>
          <div class="status-line">
            <span>${this.catalog.length} content options indexed</span>
            <span>${this.selectedCount} selections staged</span>
          </div>
        </div>

        <div class="step-tabs">
          ${STEPS.map(
            (label, index) => html`
              <button
                type="button"
                class="step-tab ${index === this.step ? "active" : ""}"
                ?disabled=${!this.canAccessStep(index)}
                @click=${() => this.handleStepSelect(index)}>
                <span>Step ${index + 1}</span>
                <strong>${label}</strong>
              </button>
            `,
          )}
        </div>

        <section class="step-panel">
          ${this.loadingCatalog
            ? html`
                <div class="loading">Loading character options…</div>
              `
            : this.renderStepContent()}
        </section>

        ${this.error
          ? html`
              <div class="error">${this.error}</div>
            `
          : ""}

        <div class="actions">
          ${this.step > 0
            ? html`
                <button class="btn" type="button" @click=${this.goBack}>Back</button>
              `
            : ""}
          <button class="btn" type="button" @click=${this.clearDraft}>Reset Draft</button>
          <span class="spacer"></span>
          ${this.step < STEPS.length - 1
            ? html`
                <button class="btn btn-primary" type="button" @click=${this.goNext}>Next Step</button>
              `
            : html`
                <button class="btn btn-primary" type="submit">Create Character</button>
              `}
        </div>
      </form>
    `;
  }

  private async loadCatalog(): Promise<void> {
    this.loadingCatalog = true;
    try {
      this.catalog = await loadSearchIndex();
    } catch {
      this.catalog = [];
      this.error = "Unable to load character options right now.";
    }
    this.loadingCatalog = false;
  }

  private loadDraft(): void {
    const emptyDraft = createEmptyDraft();
    const draft = getCharacterDraft<CharacterDraft>(emptyDraft);
    this.form = {
      ...emptyDraft,
      ...draft,
      weaponTraining: {
        ...emptyDraft.weaponTraining,
        ...(draft.weaponTraining ?? {}),
      },
      spells: draft.spells ?? [],
      features: draft.features ?? [],
      feats: draft.feats ?? [],
      expertise: draft.expertise ?? [],
      gear: draft.gear ?? [],
    };
  }

  private persistDraft(next: CharacterDraft): void {
    this.form = next;
    saveCharacterDraft(next);
  }

  private clearDraft = (): void => {
    this.form = createEmptyDraft();
    this.step = 0;
    this.error = null;
    clearCharacterDraft();
  };

  private handleSubmit = (event: Event): void => {
    event.preventDefault();
    this.error = null;

    const now = Date.now();
    const result = CharacterSchema.safeParse({
      id: crypto.randomUUID(),
      name: this.form.name.trim(),
      health: this.form.health,
      skill: this.form.skill,
      agility: this.form.agility,
      aim: this.form.aim,
      tactics: this.form.tactics,
      intelligence: this.form.intelligence,
      willpower: this.form.willpower,
      strength: this.form.strength,
      initiative: this.form.initiative,
      weaponTraining: this.form.weaponTraining,
      race: this.form.race,
      class: this.form.class,
      background: this.form.background,
      flaw: this.form.flaw,
      spells: this.form.spells,
      features: this.form.features,
      feats: this.form.feats,
      expertise: this.form.expertise,
      gear: this.form.gear,
      createdAt: now,
      updatedAt: now,
    });

    if (!result.success) {
      this.error = "Complete the required identity and stats selections before creating the character.";
      return;
    }

    this.dispatchEvent(
      new CustomEvent<Character>("character-created", {
        detail: result.data,
        bubbles: true,
        composed: true,
      }),
    );
    this.clearDraft();
  };

  private canMoveNext(step = this.step): boolean {
    if (step === 0) {
      return Boolean(
        this.form.name.trim() &&
        this.form.race &&
        this.form.class &&
        this.form.background &&
        this.form.flaw,
      );
    }
    if (step === 1) {
      return this.hasValidStats();
    }
    return true;
  }

  private canAccessStep(targetStep: number): boolean {
    if (targetStep <= this.step) {
      return true;
    }

    for (let index = 0; index < targetStep; index += 1) {
      if (!this.canMoveNext(index)) {
        return false;
      }
    }

    return true;
  }

  private handleStepSelect(index: number): void {
    if (this.canAccessStep(index)) {
      this.step = index;
      this.error = null;
    }
  }

  private goBack = (): void => {
    this.error = null;
    this.step = Math.max(0, this.step - 1);
  };

  private goNext = (): void => {
    if (!this.canMoveNext()) {
      this.error = "Finish the required selections on this step before continuing.";
      return;
    }

    this.error = null;
    this.step = Math.min(STEPS.length - 1, this.step + 1);
  };

  private renderStepContent(): TemplateResult {
    if (this.step === 0) {
      return html`
        <div class="step-header">
          <h2>Identity</h2>
          <p>Name the character, then choose race, class, background, and flaw from the published content.</p>
        </div>
        <div class="name-field">
          <label for="character-name">Character Name</label>
          <input
            id="character-name"
            .value=${this.form.name}
            @input=${this.handleNameInput}
            placeholder=${this.namePlaceholder} />
        </div>
        <div class="grid two-up">
          <character-entry-picker
            label="Race"
            helper="Required"
            placeholder="Type to find a race"
            .entries=${this.filterEntries((entry) => entry.categoryId === "races")}
            .selected=${this.singleSelection(this.form.race)}
            @selection-change=${(event: CustomEvent<{ value: CharacterContentLink[] }>) =>
              this.handleSingleSelection("race", event)}></character-entry-picker>
          <character-entry-picker
            label="Class"
            helper="Required"
            placeholder="Type to find a class"
            .entries=${this.filterEntries((entry) => entry.categoryId === "classes")}
            .selected=${this.singleSelection(this.form.class)}
            @selection-change=${(event: CustomEvent<{ value: CharacterContentLink[] }>) =>
              this.handleSingleSelection("class", event)}></character-entry-picker>
          <character-entry-picker
            label="Background"
            helper="Required"
            placeholder="Type to find a background"
            .entries=${this.filterEntries((entry) => entry.categoryId === "backgrounds")}
            .selected=${this.singleSelection(this.form.background)}
            @selection-change=${(event: CustomEvent<{ value: CharacterContentLink[] }>) =>
              this.handleSingleSelection("background", event)}></character-entry-picker>
          <character-entry-picker
            label="Flaw"
            helper="Required"
            placeholder="Type to find a flaw"
            .entries=${this.filterEntries((entry) => entry.categoryId === "flaws")}
            .selected=${this.singleSelection(this.form.flaw)}
            @selection-change=${(event: CustomEvent<{ value: CharacterContentLink[] }>) =>
              this.handleSingleSelection("flaw", event)}></character-entry-picker>
        </div>
      `;
    }

    if (this.step === 1) {
      return html`
        <div class="step-header">
          <h2>Stats</h2>
          <p>Fill in the character's combat stats, then set weapon training for blade, axe, blunt, polearm, and ranged.</p>
        </div>
        <div class="stats-layout">
          <div class="stats-grid single">
            ${this.renderStatInput("health", "Health", 1)}
          </div>
          <div class="stats-grid four-up">
            ${PRIMARY_STAT_FIELDS.map((field) => this.renderStatInput(field.key, field.label, field.min))}
          </div>
          <div class="stats-grid four-up">
            ${SECONDARY_STAT_FIELDS.map((field) => this.renderStatInput(field.key, field.label, field.min))}
          </div>
        </div>
        ${this.renderWeaponTrainingSection()}
      `;
    }

    if (this.step === 2) {
      return html`
        <div class="step-header">
          <h2>Build</h2>
          <p>
            Search published spells, features, feats, expertise, and gear. Every selection stays linked back to its
            source entry.
          </p>
        </div>
        <div class="grid two-up">
          <character-entry-picker
            label="Features"
            helper="Multiple"
            placeholder="Find features by name or text"
            .multiple=${true}
            .entries=${this.filterEntries((entry) => entry.categoryId === "features")}
            .selected=${this.form.features}
            @selection-change=${(event: CustomEvent<{ value: CharacterContentLink[] }>) =>
              this.handleMultiSelection("features", event)}></character-entry-picker>
          <character-entry-picker
            label="Feats"
            helper="Multiple"
            placeholder="Find feats"
            .multiple=${true}
            .entries=${this.filterEntries((entry) => entry.categoryId === "feats")}
            .selected=${this.form.feats}
            @selection-change=${(event: CustomEvent<{ value: CharacterContentLink[] }>) =>
              this.handleMultiSelection("feats", event)}></character-entry-picker>
          <character-entry-picker
            label="Expertise"
            helper="Multiple"
            placeholder="Find expertise"
            .multiple=${true}
            .entries=${this.filterEntries((entry) => entry.categoryId === "expertise")}
            .selected=${this.form.expertise}
            @selection-change=${(event: CustomEvent<{ value: CharacterContentLink[] }>) =>
              this.handleMultiSelection("expertise", event)}></character-entry-picker>
          <character-entry-picker
            label="Spells"
            helper="Multiple"
            placeholder="Find spells"
            .multiple=${true}
            .entries=${this.filterEntries((entry) => entry.categoryId.startsWith("spells-"))}
            .selected=${this.form.spells}
            @selection-change=${(event: CustomEvent<{ value: CharacterContentLink[] }>) =>
              this.handleMultiSelection("spells", event)}></character-entry-picker>
        </div>
        <character-entry-picker
          label="Gear"
          helper="Weapons, armor, shields, potions, scrolls"
          placeholder="Find items"
          .multiple=${true}
          .entries=${this.filterEntries((entry) => entry.categoryId.startsWith("items-"))}
          .selected=${this.form.gear}
          @selection-change=${(event: CustomEvent<{ value: CharacterContentLink[] }>) =>
            this.handleMultiSelection("gear", event)}></character-entry-picker>
      `;
    }

    return html`
      <div class="step-header">
        <h2>Review</h2>
        <p>Sanity-check the build before saving it. Every card below links back to the original published entry.</p>
      </div>

      <div class="summary-grid">
        <label>
          Name
          <input class="summary-input" .value=${this.form.name} readonly />
        </label>
        <label>
          Vitals
          <input class="summary-input" .value=${`Health ${this.form.health}`} readonly />
        </label>
        <label>
          Identity
          <input
            class="summary-input"
            .value=${[this.form.race?.title, this.form.class?.title].filter(Boolean).join(" • ")}
            readonly />
        </label>
        <label>
          Core Stats
          <input class="summary-input" .value=${this.buildCoreStatsSummary()} readonly />
        </label>
        <label>
          Weapon Training
          <input class="summary-input" .value=${this.buildWeaponTrainingSummary()} readonly />
        </label>
      </div>

      <div class="grid two-up">
        ${this.renderSelectionGroup("Race", this.singleSelection(this.form.race))}
        ${this.renderSelectionGroup("Class", this.singleSelection(this.form.class))}
        ${this.renderSelectionGroup("Background", this.singleSelection(this.form.background))}
        ${this.renderSelectionGroup("Flaw", this.singleSelection(this.form.flaw))}
      </div>

      <div class="grid two-up">
        ${this.renderSelectionGroup("Features", this.form.features)}
        ${this.renderSelectionGroup("Feats", this.form.feats)}
        ${this.renderSelectionGroup("Expertise", this.form.expertise)}
        ${this.renderSelectionGroup("Spells", this.form.spells)}
      </div>
      ${this.renderSelectionGroup("Gear", this.form.gear)}
    `;
  }

  private renderSelectionGroup(label: string, entries: CharacterContentLink[]): TemplateResult {
    return html`
      <div class="summary-group">
        <h3>${label}</h3>
        ${entries.length === 0
          ? html`
              <div class="muted">No selections yet.</div>
            `
          : html`
              <div class="selected-grid">
                ${entries.map(
                  (entry) => html`
                    <character-linked-entry-card .selection=${entry}></character-linked-entry-card>
                  `,
                )}
              </div>
            `}
      </div>
    `;
  }

  private handleNameInput = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    this.persistDraft({ ...this.form, name: input.value });
  };

  private handleNumericInput = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    const field = input.name as CharacterNumericField;
    const min = field === "health" ? 1 : 0;
    const fallback = field === "health"
      ? DEFAULT_CHARACTER_HEALTH
      : field === "initiative"
        ? DEFAULT_CHARACTER_INITIATIVE
        : DEFAULT_CHARACTER_STAT_VALUE;
    const parsed = parseInt(input.value, 10);
    const value = Number.isNaN(parsed) ? fallback : Math.max(min, parsed);
    this.persistDraft({ ...this.form, [field]: value });
  };

  private handleSingleSelection(
    key: "race" | "class" | "background" | "flaw",
    event: CustomEvent<{ value: CharacterContentLink[] }>,
  ): void {
    this.persistDraft({
      ...this.form,
      [key]: event.detail.value[0],
    });
  }

  private handleMultiSelection(
    key: "features" | "feats" | "expertise" | "spells" | "gear",
    event: CustomEvent<{ value: CharacterContentLink[] }>,
  ): void {
    this.persistDraft({
      ...this.form,
      [key]: event.detail.value,
    });
  }

  private singleSelection(value?: CharacterContentLink): CharacterContentLink[] {
    return value ? [value] : [];
  }

  private renderStatInput(key: CharacterNumericField, label: string, min: number): TemplateResult {
    return html`
      <div class="stat-field">
        <label for=${`character-${key}`}>${label}</label>
        <input
          id=${`character-${key}`}
          name=${key}
          type="number"
          min=${String(min)}
          .value=${String(this.form[key])}
          @input=${this.handleNumericInput}
          placeholder=${min === 0 ? "0" : "1"} />
      </div>
    `;
  }

  private renderWeaponTrainingSection(): TemplateResult {
    return html`
      <div class="weapon-training">
        <div class="step-header">
          <h3>Weapon Training</h3>
          <p>Clicking a rank fills up to that bubble. Each training type ranges from 0 to 5.</p>
        </div>
        <div class="weapon-training-grid">
          ${WEAPON_TRAINING_TYPES.map((type) => this.renderWeaponTrainingRow(type))}
        </div>
      </div>
    `;
  }

  private renderWeaponTrainingRow(type: WeaponTrainingType): TemplateResult {
    const value = this.form.weaponTraining[type];
    return html`
      <div class="weapon-training-row">
        <label>${this.formatWeaponTrainingLabel(type)}</label>
        <div class="bubble-row" role="group" aria-label=${`${this.formatWeaponTrainingLabel(type)} weapon training`}>
          ${Array.from({ length: 6 }, (_, index) => index).map(
            (rank) => html`
              <button
                type="button"
                class="bubble-button ${rank <= value ? "active" : ""}"
                @click=${() => this.handleWeaponTrainingChange(type, rank)}
                aria-label=${`${this.formatWeaponTrainingLabel(type)} weapon training ${rank}`}>
                ${rank}
              </button>
            `,
          )}
        </div>
      </div>
    `;
  }

  private handleWeaponTrainingChange(type: WeaponTrainingType, value: number): void {
    this.persistDraft({
      ...this.form,
      weaponTraining: {
        ...this.form.weaponTraining,
        [type]: value,
      },
    });
  }

  private formatWeaponTrainingLabel(type: WeaponTrainingType): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  private buildCoreStatsSummary(): string {
    return [
      `Skill ${this.form.skill}`,
      `Agility ${this.form.agility}`,
      `Aim ${this.form.aim}`,
      `Tactics ${this.form.tactics}`,
      `Intelligence ${this.form.intelligence}`,
      `Willpower ${this.form.willpower}`,
      `Strength ${this.form.strength}`,
      `Initiative ${this.form.initiative}`,
    ].join(" • ");
  }

  private buildWeaponTrainingSummary(): string {
    return WEAPON_TRAINING_TYPES.map(
      (type) => `${this.formatWeaponTrainingLabel(type)} ${this.form.weaponTraining[type]}`,
    ).join(" • ");
  }

  private hasValidStats(): boolean {
    return (
      this.form.health >= 1 &&
      this.form.skill >= 0 &&
      this.form.agility >= 0 &&
      this.form.aim >= 0 &&
      this.form.tactics >= 0 &&
      this.form.intelligence >= 0 &&
      this.form.willpower >= 0 &&
      this.form.strength >= 0 &&
      this.form.initiative >= 0 &&
      WEAPON_TRAINING_TYPES.every((type) => this.form.weaponTraining[type] >= 0 && this.form.weaponTraining[type] <= 5)
    );
  }

  private filterEntries(predicate: (entry: SearchIndexedEntry) => boolean): SearchIndexedEntry[] {
    return this.catalog
      .filter(predicate)
      .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title));
  }

  private get selectedCount(): number {
    return [
      this.form.race,
      this.form.class,
      this.form.background,
      this.form.flaw,
      ...this.form.features,
      ...this.form.feats,
      ...this.form.expertise,
      ...this.form.spells,
      ...this.form.gear,
    ].filter(Boolean).length;
  }
}
