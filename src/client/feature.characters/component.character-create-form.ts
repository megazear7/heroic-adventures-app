import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { globalStyles } from "../styles.global.js";
import { loadSearchIndex, SearchIndexedEntry } from "../service.search.js";
import { Character, CharacterContentLink, CharacterSchema } from "../../shared/type.character.js";
import { clearCharacterDraft, getCharacterDraft, saveCharacterDraft } from "../../shared/service.characters.js";
import "./component.character-entry-picker.js";
import "./component.character-linked-entry-card.js";

const STEPS = ["Identity", "Story", "Build", "Review"] as const;

type CharacterDraft = {
  name: string;
  health: number;
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

const EMPTY_DRAFT: CharacterDraft = {
  name: "",
  health: 10,
  spells: [],
  features: [],
  feats: [],
  expertise: [],
  gear: [],
};

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
        .step-tabs {
          grid-template-columns: 1fr;
        }
      }
    `,
  ];

  @state() private catalog: SearchIndexedEntry[] = [];
  @state() private form: CharacterDraft = EMPTY_DRAFT;
  @state() private error: string | null = null;
  @state() private step = 0;
  @state() private loadingCatalog = true;

  override connectedCallback(): void {
    super.connectedCallback();
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
    const draft = getCharacterDraft<CharacterDraft>(EMPTY_DRAFT);
    this.form = {
      ...EMPTY_DRAFT,
      ...draft,
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
    this.form = EMPTY_DRAFT;
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
      this.error = "Complete the required identity and story selections before creating the character.";
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
      return Boolean(this.form.name.trim() && this.form.health >= 1 && this.form.race && this.form.class);
    }
    if (step === 1) {
      return Boolean(this.form.background && this.form.flaw);
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
          <p>Name the character, then choose race and class from the published content.</p>
        </div>
        <div class="name-field">
          <label for="character-name">Character Name</label>
          <input
            id="character-name"
            .value=${this.form.name}
            @input=${this.handleNameInput}
            placeholder="Aldren of the White Peaks" />
        </div>
        <div class="name-field">
          <label for="character-health">Health</label>
          <input
            id="character-health"
            type="number"
            min="1"
            .value=${String(this.form.health)}
            @input=${this.handleHealthInput}
            placeholder="10" />
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
        </div>
      `;
    }

    if (this.step === 1) {
      return html`
        <div class="step-header">
          <h2>Story</h2>
          <p>Anchor the build with background and flaw so later feature choices stay grounded in play style.</p>
        </div>
        <div class="grid two-up">
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
          Health
          <input class="summary-input" .value=${String(this.form.health)} readonly />
        </label>
        <label>
          Identity
          <input
            class="summary-input"
            .value=${[this.form.race?.title, this.form.class?.title].filter(Boolean).join(" • ")}
            readonly />
        </label>
        <label>
          Story
          <input
            class="summary-input"
            .value=${[this.form.background?.title, this.form.flaw?.title].filter(Boolean).join(" • ")}
            readonly />
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

  private handleHealthInput = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    const parsed = parseInt(input.value, 10);
    const health = Number.isNaN(parsed) ? 10 : Math.max(1, parsed);
    this.persistDraft({ ...this.form, health });
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
