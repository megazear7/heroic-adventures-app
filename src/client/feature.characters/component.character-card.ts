import { css, html, LitElement, nothing, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { globalStyles } from "../styles.global.js";
import {
  deleteCharacter,
  getCharacters,
  setCharacterArchived,
  upsertCharacter,
} from "../../shared/service.characters.js";
import {
  Character,
  CharacterContentLink,
  CharacterSelectionKey,
  CharacterSingleSelectionKey,
  WEAPON_TRAINING_TYPES,
  WeaponTrainingType,
  getActiveEquipmentProfile,
} from "../../shared/type.character.js";
import { loadSearchIndex, SearchIndexedEntry } from "../service.search.js";
import { kebabIcon, pencilIcon, copyIcon } from "../icons.js";
import "./component.character-linked-entry-card.js";
import "./component.character-entry-picker.js";
import "./component.character-equipment-profile-editor.js";
import type { EquipmentProfilesChangeDetail } from "./component.character-equipment-profile-editor.js";

@customElement("character-card")
export class CharacterCard extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        display: block;
      }

      .sheet {
        display: grid;
        gap: var(--size-large);
        padding: var(--size-large);
        background: var(--color-primary-surface-raised);
        border: var(--border-normal);
        border-radius: var(--border-radius-medium);
        box-shadow: var(--shadow-normal);
      }

      .sheet.compact {
        gap: var(--size-medium);
        padding: var(--size-large);
      }

      .header {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: var(--size-medium);
      }

      .header-content {
        min-width: 0;
        display: grid;
        gap: var(--size-small);
      }

      .header.compact {
        gap: var(--size-small);
      }

      .header-main {
        min-width: 0;
        display: grid;
        gap: var(--size-small);
      }

      .name-link {
        color: inherit;
      }

      .name-row {
        display: flex;
        align-items: center;
        gap: var(--size-small);
        flex-wrap: wrap;
      }

      .name-row h2 {
        margin: 0;
      }

      .name-edit-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: none;
        color: var(--color-primary-text-muted);
        cursor: pointer;
        padding: 0;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition:
          opacity 150ms ease,
          visibility 0s linear 150ms;
      }

      .name-row:hover .name-edit-btn,
      .name-row:focus-within .name-edit-btn,
      .name-edit-btn:focus-visible {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transition:
          opacity 150ms ease,
          visibility 0s linear 0s;
      }

      .name-edit-btn:hover,
      .name-edit-btn:focus-visible {
        color: var(--color-1);
        outline: none;
      }

      .name-input {
        all: unset;
        font-family: var(--font-family-display);
        font-size: var(--font-large);
        color: var(--color-primary-text-bold);
        font-weight: 700;
      }

      .header.compact h2 {
        margin: 0;
        font-size: 1.05rem;
      }

      .summary {
        display: flex;
        gap: var(--size-small);
        flex-wrap: wrap;
      }

      .summary.compact {
        gap: 6px;
      }

      .pill {
        border: var(--border-normal);
        border-radius: 999px;
        padding: 6px 10px;
        font-size: var(--font-tiny);
        color: var(--color-primary-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .pill-button {
        background: transparent;
        cursor: pointer;
      }

      .pill-button:hover,
      .pill-button:focus-visible {
        color: var(--color-primary-text);
        border-color: rgba(201, 168, 76, 0.45);
        outline: none;
      }

      .pill.compact {
        padding: 4px 8px;
      }

      .preview-copy {
        margin: 0;
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
        line-height: 1.5;
      }

      .preview-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .preview-stat-label {
        display: block;
        margin-bottom: 4px;
        color: var(--color-primary-text-muted);
        font-size: var(--font-tiny);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .preview-stat-value {
        display: block;
        color: var(--color-primary-text);
        font-size: var(--font-small);
        font-weight: 600;
      }

      .preview-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--size-small);
      }

      .preview-link {
        color: var(--color-1);
        font-size: var(--font-small);
        font-weight: 600;
        text-decoration: none;
      }

      .preview-link:hover {
        text-decoration: underline;
      }

      .menu-wrap {
        position: relative;
      }

      .menu-trigger {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        color: var(--color-primary-text-muted);
        cursor: pointer;
      }

      .menu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 4px;
        background: var(--color-primary-surface-raised);
        border: var(--border-normal);
        border-radius: var(--border-radius-small);
        box-shadow: var(--shadow-medium);
        z-index: 5;
        overflow: hidden;
        min-width: 150px;
      }

      .menu button {
        width: 100%;
        text-align: left;
        border: none;
        background: none;
        color: var(--color-primary-text);
        padding: 10px 12px;
        cursor: pointer;
      }

      .menu button:hover {
        background: rgba(201, 168, 76, 0.08);
      }

      .export-details {
        display: grid;
        gap: var(--size-medium);
      }

      .export-details p {
        margin: 0;
        color: var(--color-primary-text-muted);
        line-height: 1.5;
      }

      .export-link-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: var(--size-small);
        align-items: start;
      }

      .export-link {
        width: 100%;
        box-sizing: border-box;
        padding: 12px 14px;
        border-radius: var(--border-radius-small);
        border: var(--border-normal);
        background: var(--color-primary-surface-overlay);
        color: var(--color-primary-text);
        font-size: var(--font-small);
        font-family: var(--font-family);
        line-height: 1.5;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .export-copy {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        border-radius: 999px;
        border: var(--border-normal);
        background: rgba(255, 255, 255, 0.03);
        color: var(--color-primary-text);
        cursor: pointer;
      }

      .export-copy:hover,
      .export-copy:focus-visible {
        border-color: rgba(201, 168, 76, 0.45);
        color: var(--color-1);
        outline: none;
      }

      .grid {
        display: grid;
        gap: var(--size-medium);
      }

      .grid.two-up {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .stats-layout {
        display: grid;
        gap: var(--size-medium);
        grid-template-columns: repeat(8, minmax(0, 1fr));
      }

      .stat-item {
        display: grid;
        gap: 6px;
      }

      .stat-item label,
      .weapon-training-row label {
        font-size: var(--font-small);
        font-weight: 600;
        color: var(--color-primary-text-muted);
      }

      .stat-item input {
        width: 100%;
        box-sizing: border-box;
        padding: 10px 12px;
        border-radius: var(--border-radius-small);
        border: var(--border-normal);
        background: var(--color-primary-surface-overlay);
        color: var(--color-primary-text);
        font: inherit;
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

      .section {
        display: grid;
        gap: var(--size-small);
      }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--size-small);
      }

      .edit-btn {
        border: none;
        background: none;
        color: var(--color-primary-text-muted);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition:
          opacity 150ms ease,
          visibility 0s linear 150ms;
      }

      .edit-btn:hover {
        color: var(--color-1);
      }

      .section:hover .edit-btn,
      .section:focus-within .edit-btn,
      .edit-btn:focus-visible {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transition:
          opacity 150ms ease,
          visibility 0s linear 0s;
      }

      @media (hover: none) {
        .edit-btn {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
      }

      .feedback {
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
      }

      /* Style guide: modal overlay/surface/header/actions/close come from globalStyles. */
      .modal-form {
        display: grid;
        gap: var(--size-medium);
      }

      .modal-form label {
        display: grid;
        gap: 6px;
        font-size: var(--font-small);
        color: var(--color-primary-text-muted);
      }

      .modal-form input {
        --form-input-border: var(--border-normal);
      }

      .modal-form input[type="number"] {
        width: 100%;
        box-sizing: border-box;
      }

      @media (max-width: 800px) {
        .grid.two-up,
        .stats-layout,
        .weapon-training-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ];

  @property({ attribute: false }) character!: Character;
  @property({ type: Boolean }) compact = false;
  @state() private feedback = "";
  @state() private menuOpen = false;
  @state() private modalOpen = false;
  @state() private modalSectionLabel = "";
  @state() private modalSectionKey: CharacterSelectionKey | null = null;
  @state() private modalSectionMultiple = false;
  @state() private modalChoices: SearchIndexedEntry[] = [];
  @state() private modalSelection: CharacterContentLink[] = [];
  @state() private catalog: SearchIndexedEntry[] = [];
  @state() private nameEditing = false;
  @state() private nameDraft = "";
  @state() private statModalOpen = false;
  @state() private statModalKey: "health" | "initiative" | null = null;
  @state() private statModalLabel = "";
  @state() private statModalDraft = "0";
  @state() private exportModalOpen = false;

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("click", this.handleDocumentClick);
    void this.loadCatalog();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("click", this.handleDocumentClick);
  }

  override render(): TemplateResult {
    if (!this.character) return html``;
    const c = this.character;
    if (this.compact) {
      return this.renderCompactCard(c);
    }

    return html`
      <div class="sheet">
        <div class="header">
          <div class="header-content">
            <div class="name-row">
              ${this.nameEditing
                ? html`
                    <input
                      class="name-input"
                      .value=${this.nameDraft}
                      @input=${this.handleNameDraftInput}
                      @blur=${this.finishNameEditing}
                      @keydown=${this.handleNameDraftKeydown}
                      aria-label="Character name" />
                  `
                : html`
                    <h2><a class="name-link" href="/character/${c.id}">${c.name}</a></h2>
                  `}
              <button class="name-edit-btn" type="button" @click=${this.handleNameEditToggle} aria-label="Edit name">
                ${pencilIcon}
              </button>
            </div>
            <div class="summary">
              <button class="pill pill-button" type="button" @click=${() => this.openStatModal("health")}>${c.health} HP</button>
              <button class="pill pill-button" type="button" @click=${() => this.openStatModal("initiative")}>Init ${c.initiative}</button>
              <button class="pill pill-button" type="button" @click=${() => this.openEditor("Race", "race", false)}>${c.race.title}</button>
              <button class="pill pill-button" type="button" @click=${() => this.openEditor("Class", "class", false)}>${c.class.title}</button>
              <button class="pill pill-button" type="button" @click=${() => this.openEditor("Background", "background", false)}>${c.background.title}</button>
              <button class="pill pill-button" type="button" @click=${() => this.openEditor("Flaw", "flaw", false)}>${c.flaw.title}</button>
              ${c.archived
                ? html`
                    <span class="pill">Archived</span>
                  `
                : nothing}
            </div>
          </div>
          <div class="menu-wrap">
            <button class="menu-trigger" type="button" @click=${this.toggleMenu} aria-label="Character actions">
              ${kebabIcon}
            </button>
            ${this.menuOpen
              ? html`
                  <div class="menu">
                    <button type="button" @click=${this.shareCharacter}>Share</button>
                    <button type="button" @click=${this.openExportModal}>Export</button>
                    <button type="button" @click=${this.copyCharacter}>Copy</button>
                    <button type="button" @click=${this.duplicateCharacter}>Duplicate</button>
                    <button type="button" @click=${this.toggleArchiveCharacter}>
                      ${this.character.archived ? "Restore" : "Archive"}
                    </button>
                    <button type="button" @click=${this.removeCharacter}>Delete</button>
                  </div>
                `
              : nothing}
          </div>
        </div>

        <div class="stats-layout">
          ${this.renderStatField("skill", "Skill")}
          ${this.renderStatField("agility", "Agility")}
          ${this.renderStatField("aim", "Aim")}
          ${this.renderStatField("tactics", "Tactics")}
          ${this.renderStatField("intelligence", "Intelligence")}
          ${this.renderStatField("willpower", "Willpower")}
          ${this.renderStatField("strength", "Strength")}
          ${this.renderStatField("initiative", "Initiative")}
        </div>

        <div class="grid two-up">
          ${this.renderSection("Race", "race", false, [c.race])}
          ${this.renderSection("Class", "class", false, [c.class])}
          ${this.renderSection("Background", "background", false, [c.background])}
          ${this.renderSection("Flaw", "flaw", false, [c.flaw])}
        </div>

        <div class="grid two-up">
          ${this.renderSection("Features", "features", true, c.features)}
          ${this.renderSection("Feats", "feats", true, c.feats)}
          ${this.renderSection("Expertise", "expertise", true, c.expertise)}
          ${this.renderSection("Spells", "spells", true, c.spells)}
        </div>
        ${this.renderSection("Gear", "gear", true, c.gear)}
        ${this.renderEquipmentProfilesSection(c)}
        ${this.renderWeaponTrainingSection(c)}
        ${this.feedback
          ? html`
              <div class="feedback">${this.feedback}</div>
            `
          : nothing}
      </div>

      ${this.modalOpen ? this.renderEditModal() : nothing}
      ${this.statModalOpen ? this.renderStatModal() : nothing}
      ${this.exportModalOpen ? this.renderExportModal() : nothing}
    `;
  }

  private renderCompactCard(character: Character): TemplateResult {
    return html`
      <div class="sheet compact">
        <div class="header compact">
          <div class="header-main">
            <h2><a class="name-link" href="/character/${character.id}">${character.name}</a></h2>
            <div class="summary compact">
              <span class="pill compact">${character.race.title}</span>
              <span class="pill compact">${character.class.title}</span>
              ${character.archived
                ? html`
                    <span class="pill compact">Archived</span>
                  `
                : nothing}
            </div>
          </div>
          <div class="menu-wrap">
            <button class="menu-trigger" type="button" @click=${this.toggleMenu} aria-label="Character actions">
              ${kebabIcon}
            </button>
            ${this.menuOpen
              ? html`
                  <div class="menu">
                    <button type="button" @click=${this.shareCharacter}>Share</button>
                    <button type="button" @click=${this.openExportModal}>Export</button>
                    <button type="button" @click=${this.copyCharacter}>Copy</button>
                    <button type="button" @click=${this.duplicateCharacter}>Duplicate</button>
                    <button type="button" @click=${this.toggleArchiveCharacter}>
                      ${this.character.archived ? "Restore" : "Archive"}
                    </button>
                    <button type="button" @click=${this.removeCharacter}>Delete</button>
                  </div>
                `
              : nothing}
          </div>
        </div>

        <p class="preview-copy">
          ${character.background.title} background with ${character.flaw.title.toLowerCase()} flaw.
        </p>

        <div class="preview-grid">
          <div class="preview-stat">
            <span class="preview-stat-label">Vitals</span>
            <span class="preview-stat-value">${character.health} HP</span>
          </div>
          <div class="preview-stat">
            <span class="preview-stat-label">Loadout</span>
            <span class="preview-stat-value">${character.equipmentProfiles.length} profiles • ${character.gear.length} gear</span>
          </div>
          <div class="preview-stat">
            <span class="preview-stat-label">Build</span>
            <span class="preview-stat-value">${character.features.length} features • ${character.feats.length} feats</span>
          </div>
          <div class="preview-stat">
            <span class="preview-stat-label">Training</span>
            <span class="preview-stat-value">${character.expertise.length} expertise</span>
          </div>
        </div>

        ${this.feedback
          ? html`
              <div class="feedback">${this.feedback}</div>
            `
          : nothing}
      </div>

      ${this.modalOpen ? this.renderEditModal() : nothing}
      ${this.statModalOpen ? this.renderStatModal() : nothing}
      ${this.exportModalOpen ? this.renderExportModal() : nothing}
    `;
  }

  private renderStatField(key: "skill" | "agility" | "aim" | "tactics" | "intelligence" | "willpower" | "strength" | "initiative", label: string): TemplateResult {
    return html`
      <div class="stat-item">
        <label>
          ${label}
          <input
            type="number"
            min="0"
            .value=${String(this.character[key])}
            @input=${(event: Event) => this.updateNumericField(key, (event.target as HTMLInputElement).value, 0)} />
        </label>
      </div>
    `;
  }

  private renderWeaponTrainingSection(character: Character): TemplateResult {
    return html`
      <section class="section weapon-training">
        <div class="section-header">
          <h3>Weapon Training</h3>
        </div>
        <div class="weapon-training-grid">
          ${WEAPON_TRAINING_TYPES.map((type) => this.renderWeaponTrainingRow(character, type))}
        </div>
      </section>
    `;
  }

  private renderEquipmentProfilesSection(character: Character): TemplateResult {
    const activeProfile = getActiveEquipmentProfile(character);
    return html`
      <character-equipment-profile-editor
        .title=${"Equipment Profiles"}
        .description=${`Active profile: ${activeProfile.primary?.title ?? "No primary"} • ${activeProfile.armor?.title ?? "No armor"}`}
        .profiles=${character.equipmentProfiles}
        .activeProfileId=${character.activeEquipmentProfileId ?? activeProfile.id}
        .catalog=${this.catalog}
        @profiles-change=${this.handleEquipmentProfilesChange}></character-equipment-profile-editor>
    `;
  }

  private renderWeaponTrainingRow(character: Character, type: WeaponTrainingType): TemplateResult {
    const value = character.weaponTraining[type];
    return html`
      <div class="weapon-training-row">
        <label>${this.formatWeaponTrainingLabel(type)}</label>
        <div class="bubble-row" role="group" aria-label=${`${this.formatWeaponTrainingLabel(type)} weapon training`}>
          ${Array.from({ length: 6 }, (_, index) => index).map(
            (rank) => html`
              <button
                type="button"
                class="bubble-button ${rank <= value ? "active" : ""}"
                @click=${() => this.updateWeaponTraining(type, rank)}
                aria-label=${`${this.formatWeaponTrainingLabel(type)} weapon training ${rank}`}>
                ${rank}
              </button>
            `,
          )}
        </div>
      </div>
    `;
  }

  private renderSection(
    label: string,
    key: CharacterSelectionKey,
    multiple: boolean,
    entries: CharacterContentLink[],
  ): TemplateResult {
    return html`
      <section class="section">
        <div class="section-header">
          <h3>${label}</h3>
          <button class="edit-btn" type="button" @click=${() => this.openEditor(label, key, multiple)}>
            ${pencilIcon}
          </button>
        </div>
        ${entries.length === 0
          ? html`
              <div class="muted">Nothing selected yet.</div>
            `
          : entries.map(
              (entry) => html`
                <character-linked-entry-card .selection=${entry}></character-linked-entry-card>
              `,
            )}
      </section>
    `;
  }

  private renderEditModal(): TemplateResult {
    return html`
      <div class="modal-overlay" @click=${this.closeModal}>
        <div class="modal-surface" @click=${(event: Event) => event.stopPropagation()}>
          <div class="modal-header">
            <h3>Edit ${this.modalSectionLabel}</h3>
            <button class="modal-close" type="button" @click=${this.closeModal}>Confirm</button>
          </div>
          <character-entry-picker
            .label=${this.modalSectionLabel}
            .multiple=${this.modalSectionMultiple}
            .entries=${this.modalChoices}
            .selected=${this.modalSelection}
            @selection-change=${this.handleModalSelection}></character-entry-picker>
          <div class="modal-actions">
            <button class="btn" type="button" @click=${this.closeModal}>Confirm</button>
          </div>
        </div>
      </div>
    `;
  }

  private renderStatModal(): TemplateResult {
    return html`
      <div class="modal-overlay" @click=${this.closeStatModal}>
        <div class="modal-surface" @click=${(event: Event) => event.stopPropagation()}>
          <div class="modal-header">
            <h3>Edit ${this.statModalLabel}</h3>
            <button class="modal-close" type="button" @click=${this.closeStatModal}>Confirm</button>
          </div>
          <div class="modal-form">
            <label>
              <input
                class="form-input"
                type="number"
                min=${this.statModalKey === "health" ? "1" : "0"}
                .value=${this.statModalDraft}
                @input=${this.handleStatModalInput}
                placeholder=${this.statModalKey === "health" ? "10" : "0"} />
            </label>
          </div>
          <div class="modal-actions">
            <button class="btn" type="button" @click=${this.closeStatModal}>Confirm</button>
          </div>
        </div>
      </div>
    `;
  }

  private renderExportModal(): TemplateResult {
    const exportUrl = this.getExportUrl();
    return html`
      <div class="modal-overlay" @click=${this.closeExportModal}>
        <div class="modal-surface" @click=${(event: Event) => event.stopPropagation()}>
          <div class="modal-header">
            <h3>Export Character</h3>
            <button class="modal-close" type="button" @click=${this.closeExportModal}>Confirm</button>
          </div>
          <div class="export-details">
            <p>Send this url to someone else to allow them to load this character into their Heroic Adventures app.</p>
            <div class="export-link-row">
              <input
                class="export-link"
                type="text"
                .value=${exportUrl}
                readonly
                @focus=${this.selectExportUrl}
                aria-label="Character export URL" />
              <button class="export-copy" type="button" @click=${this.copyExportUrl} aria-label="Copy export URL">
                ${copyIcon}
              </button>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn" type="button" @click=${this.closeExportModal}>Confirm</button>
          </div>
        </div>
      </div>
    `;
  }

  private async copyCharacter(): Promise<void> {
    this.menuOpen = false;
    try {
      await navigator.clipboard.writeText(JSON.stringify(this.character, null, 2));
      this.feedback = "Character copied to clipboard.";
    } catch {
      this.feedback = "Clipboard unavailable.";
    }
  }

  private async shareCharacter(): Promise<void> {
    this.menuOpen = false;
    const text = `${this.character.name} • ${this.character.race.title} ${this.character.class.title}`;
    if (!("share" in navigator)) {
      await this.copyCharacter();
      return;
    }
    navigator
      .share({
        title: `Heroic Adventures Character: ${this.character.name}`,
        text,
      })
      .catch(() => {
        this.feedback = "Share canceled.";
      });
  }

  private getExportUrl(): string {
    const loadCharacter = encodeURIComponent(JSON.stringify(this.character));
    return `https://www.heroicadventures.app/character/${this.character.id}?loadCharacter=${loadCharacter}`;
  }

  private openExportModal = (): void => {
    this.menuOpen = false;
    this.exportModalOpen = true;
  };

  private closeExportModal = (): void => {
    this.exportModalOpen = false;
  };

  private copyExportUrl = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(this.getExportUrl());
      this.feedback = "Export URL copied to clipboard.";
    } catch {
      this.feedback = "Clipboard unavailable.";
    }
  };

  private selectExportUrl = (event: Event): void => {
    (event.target as HTMLInputElement).select();
  };

  private duplicateCharacter = (): void => {
    this.menuOpen = false;
    const now = Date.now();
    const existingNames = new Set(getCharacters().map((character) => character.name));
    let nextName = `${this.character.name} Copy`;
    let copyNumber = 2;
    while (existingNames.has(nextName)) {
      nextName = `${this.character.name} Copy ${copyNumber}`;
      copyNumber += 1;
    }
    const duplicate = {
      ...this.character,
      id: crypto.randomUUID(),
      name: nextName,
      archived: false,
      createdAt: now,
      updatedAt: now,
    };
    upsertCharacter(duplicate);
    this.feedback = "Character duplicated.";
  };

  private handleNameEditToggle = (): void => {
    if (this.nameEditing) {
      this.commitNameDraft();
      return;
    }
    this.nameDraft = this.character.name;
    this.nameEditing = true;
  };

  private handleNameDraftInput = (event: Event): void => {
    const nextValue = (event.target as HTMLInputElement).value;
    this.nameDraft = nextValue;
    this.commitNameDraft(nextValue);
  };

  private handleNameDraftKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Enter") {
      event.preventDefault();
      this.finishNameEditing();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      this.finishNameEditing();
    }
  };

  private commitNameDraft = (rawValue = this.nameDraft): void => {
    const name = rawValue.trim();
    if (!name || name === this.character.name) {
      return;
    }
    upsertCharacter({
      ...this.character,
      name,
      updatedAt: Date.now(),
    });
    this.feedback = "Character updated.";
  };

  private finishNameEditing = (): void => {
    this.nameEditing = false;
    this.nameDraft = this.character.name;
  };

  private openStatModal = (key: "health" | "initiative"): void => {
    this.statModalKey = key;
    this.statModalLabel = key === "health" ? "Health" : "Initiative";
    this.statModalDraft = String(this.character[key]);
    this.statModalOpen = true;
  };

  private closeStatModal = (): void => {
    this.statModalOpen = false;
    this.statModalKey = null;
    this.statModalLabel = "";
    this.statModalDraft = "0";
  };

  private handleStatModalInput = (event: Event): void => {
    this.statModalDraft = (event.target as HTMLInputElement).value;
    this.applyStatModalDraft();
  };

  private applyStatModalDraft = (): void => {
    if (!this.statModalKey) {
      return;
    }
    const parsed = parseInt(this.statModalDraft, 10);
    const min = this.statModalKey === "health" ? 1 : 0;
    if (Number.isNaN(parsed) || parsed < min) {
      return;
    }
    upsertCharacter({
      ...this.character,
      [this.statModalKey]: parsed,
      updatedAt: Date.now(),
    });
    this.feedback = `${this.statModalLabel} updated.`;
  };

  private updateNumericField(
    key: "skill" | "agility" | "aim" | "tactics" | "intelligence" | "willpower" | "strength" | "initiative",
    rawValue: string,
    min: number,
  ): void {
    const parsed = parseInt(rawValue, 10);
    const nextValue = Number.isNaN(parsed) ? min : Math.max(min, parsed);
    upsertCharacter({
      ...this.character,
      [key]: nextValue,
      updatedAt: Date.now(),
    });
    this.feedback = "Character updated.";
  };

  private updateWeaponTraining(type: WeaponTrainingType, value: number): void {
    upsertCharacter({
      ...this.character,
      weaponTraining: {
        ...this.character.weaponTraining,
        [type]: value,
      },
      updatedAt: Date.now(),
    });
    this.feedback = "Character updated.";
  }

  private formatWeaponTrainingLabel(type: WeaponTrainingType): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  private async loadCatalog(): Promise<void> {
    if (this.catalog.length > 0) {
      return;
    }

    this.catalog = await loadSearchIndex();
  }

  private removeCharacter = (): void => {
    this.menuOpen = false;
    deleteCharacter(this.character.id);
  };

  private toggleArchiveCharacter = (): void => {
    this.menuOpen = false;
    const archived = !this.character.archived;
    setCharacterArchived(this.character.id, archived);
    this.feedback = archived ? "Character archived." : "Character restored.";
  };

  private toggleMenu = (event: Event): void => {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  };

  private handleDocumentClick = (event: Event): void => {
    const menuWrap = this.renderRoot.querySelector(".menu-wrap");
    const clickedInsideMenu = menuWrap ? event.composedPath().includes(menuWrap) : false;
    if (this.menuOpen && !clickedInsideMenu) {
      this.menuOpen = false;
    }
  };

  private async openEditor(label: string, key: CharacterSelectionKey, multiple: boolean): Promise<void> {
    if (this.catalog.length === 0) {
      this.catalog = await loadSearchIndex();
    }
    this.modalSectionLabel = label;
    this.modalSectionKey = key;
    this.modalSectionMultiple = multiple;
    this.modalChoices = this.catalog.filter((entry) => this.matchesSection(key, entry.categoryId));
    this.modalSelection = this.getSectionSelection(key);
    this.modalOpen = true;
  }

  private getSectionSelection(key: CharacterSelectionKey): CharacterContentLink[] {
    if (key === "race" || key === "class" || key === "background" || key === "flaw") {
      return [this.character[key]];
    }
    return this.character[key];
  }

  private matchesSection(key: CharacterSelectionKey, categoryId: string): boolean {
    if (key === "race") return categoryId === "races";
    if (key === "class") return categoryId === "classes";
    if (key === "background") return categoryId === "backgrounds";
    if (key === "flaw") return categoryId === "flaws";
    if (key === "features") return categoryId === "features";
    if (key === "feats") return categoryId === "feats";
    if (key === "expertise") return categoryId === "expertise";
    if (key === "spells") return categoryId.startsWith("spells-");
    return categoryId.startsWith("items-") && categoryId !== "items-weapon" && categoryId !== "items-armor";
  }

  private handleEquipmentProfilesChange = (event: CustomEvent<EquipmentProfilesChangeDetail>): void => {
    upsertCharacter({
      ...this.character,
      equipmentProfiles: event.detail.profiles,
      activeEquipmentProfileId: event.detail.activeProfileId,
      updatedAt: Date.now(),
    });
    this.feedback = "Equipment profiles updated.";
  };

  private handleModalSelection = (event: CustomEvent<{ value: CharacterContentLink[] }>): void => {
    this.modalSelection = event.detail.value;
    this.applyModalSelection();
  };

  private applyModalSelection = (): void => {
    if (!this.modalSectionKey) {
      return;
    }

    const updatedAt = Date.now();
    let next: Character;
    if (this.isSingleSelectionKey(this.modalSectionKey)) {
      const singleValue = this.modalSelection[0];
      if (!singleValue) {
        this.feedback = "Select an entry before saving.";
        return;
      }
      next = {
        ...this.character,
        [this.modalSectionKey]: singleValue,
        updatedAt,
      };
    } else {
      next = {
        ...this.character,
        [this.modalSectionKey]: this.modalSelection,
        updatedAt,
      };
    }

    upsertCharacter(next);
    this.feedback = `${this.modalSectionLabel} updated.`;
  };

  private closeModal = (): void => {
    this.modalOpen = false;
    this.modalSectionLabel = "";
    this.modalSectionKey = null;
    this.modalChoices = [];
    this.modalSelection = [];
  };

  private isSingleSelectionKey(key: CharacterSelectionKey): key is CharacterSingleSelectionKey {
    return key === "race" || key === "class" || key === "background" || key === "flaw";
  }
}
