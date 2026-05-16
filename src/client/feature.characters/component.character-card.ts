import { css, html, LitElement, nothing, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { globalStyles } from "../styles.global.js";
import { deleteCharacter, upsertCharacter } from "../../shared/service.characters.js";
import {
  Character,
  CharacterContentLink,
  CharacterSelectionKey,
  CharacterSingleSelectionKey,
} from "../../shared/type.character.js";
import { loadSearchIndex, SearchIndexedEntry } from "../service.search.js";
import { kebabIcon, pencilIcon } from "../icons.js";
import "./component.character-linked-entry-card.js";
import "./component.character-entry-picker.js";

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

      .header {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: var(--size-medium);
      }

      .name-link {
        color: inherit;
      }

      .summary {
        display: flex;
        gap: var(--size-small);
        flex-wrap: wrap;
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

      .grid {
        display: grid;
        gap: var(--size-medium);
      }

      .grid.two-up {
        grid-template-columns: repeat(2, minmax(0, 1fr));
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
      }

      .edit-btn:hover {
        color: var(--color-1);
      }

      .feedback {
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
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
        width: min(760px, 100%);
        background: var(--color-primary-surface-raised);
        border: var(--border-normal);
        border-radius: var(--border-radius-medium);
        padding: var(--size-large);
        display: grid;
        gap: var(--size-medium);
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--size-small);
      }

      @media (max-width: 800px) {
        .grid.two-up {
          grid-template-columns: 1fr;
        }
      }
    `,
  ];

  @property({ attribute: false }) character!: Character;
  @state() private feedback = "";
  @state() private menuOpen = false;
  @state() private modalOpen = false;
  @state() private modalSectionLabel = "";
  @state() private modalSectionKey: CharacterSelectionKey | null = null;
  @state() private modalSectionMultiple = false;
  @state() private modalChoices: SearchIndexedEntry[] = [];
  @state() private modalSelection: CharacterContentLink[] = [];
  @state() private catalog: SearchIndexedEntry[] = [];

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("click", this.handleDocumentClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("click", this.handleDocumentClick);
  }

  override render(): TemplateResult {
    if (!this.character) return html``;
    const c = this.character;
    return html`
      <div class="sheet">
        <div class="header">
          <div>
            <h2><a class="name-link" href="/character/${c.id}">${c.name}</a></h2>
            <div class="summary">
              <span class="pill">${c.race.title}</span>
              <span class="pill">${c.class.title}</span>
              <span class="pill">${c.background.title}</span>
              <span class="pill">${c.flaw.title}</span>
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
                    <button type="button" @click=${this.exportCharacter}>Export JSON</button>
                    <button type="button" @click=${this.copyCharacter}>Copy</button>
                    <button type="button" @click=${this.duplicateCharacter}>Duplicate</button>
                    <button type="button" @click=${this.removeCharacter}>Delete</button>
                  </div>
                `
              : nothing}
          </div>
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
        ${this.feedback
          ? html`
              <div class="feedback">${this.feedback}</div>
            `
          : nothing}
      </div>

      ${this.modalOpen ? this.renderEditModal() : nothing}
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
      <div class="overlay" @click=${this.closeModal}>
        <div class="modal" @click=${(event: Event) => event.stopPropagation()}>
          <h3>Edit ${this.modalSectionLabel}</h3>
          <character-entry-picker
            .label=${this.modalSectionLabel}
            .multiple=${this.modalSectionMultiple}
            .entries=${this.modalChoices}
            .selected=${this.modalSelection}
            @selection-change=${this.handleModalSelection}></character-entry-picker>
          <div class="modal-actions">
            <button class="btn" type="button" @click=${this.closeModal}>Cancel</button>
            <button class="btn btn-primary" type="button" @click=${this.saveModal}>Save</button>
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

  private sanitizeFileName(name: string): string {
    if (!name.trim()) return "character";
    return (
      name
        .replace(/[^a-z0-9-_]+/gi, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase() || "character"
    );
  }

  private exportCharacter(): void {
    this.menuOpen = false;
    const blob = new Blob([JSON.stringify(this.character, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${this.sanitizeFileName(this.character.name)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    this.feedback = "Character exported.";
  }

  private duplicateCharacter = (): void => {
    this.menuOpen = false;
    const now = Date.now();
    const duplicate = {
      ...this.character,
      id: crypto.randomUUID(),
      name: `${this.character.name} Copy`,
      createdAt: now,
      updatedAt: now,
    };
    upsertCharacter(duplicate);
    this.feedback = "Character duplicated.";
  };

  private removeCharacter = (): void => {
    this.menuOpen = false;
    deleteCharacter(this.character.id);
  };

  private toggleMenu = (event: Event): void => {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  };

  private handleDocumentClick = (event: Event): void => {
    const clickedInside = event
      .composedPath()
      .some((target) => target === this || target === this.shadowRoot || target === this.renderRoot);
    if (this.menuOpen && !clickedInside) {
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
    return categoryId.startsWith("items-");
  }

  private handleModalSelection = (event: CustomEvent<{ value: CharacterContentLink[] }>): void => {
    this.modalSelection = event.detail.value;
  };

  private saveModal = (): void => {
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
    this.closeModal();
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
