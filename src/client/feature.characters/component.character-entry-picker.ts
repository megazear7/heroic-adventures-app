import { css, html, LitElement, TemplateResult, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { globalStyles } from "../styles.global.js";
import { searchIcon } from "../icons.js";
import { SearchIndexedEntry, scoreSearchEntry } from "../service.search.js";
import { CharacterContentLink } from "../../shared/type.character.js";
import { createCharacterContentLink } from "../../shared/service.characters.js";
import "./component.character-linked-entry-card.js";

@customElement("character-entry-picker")
export class CharacterEntryPicker extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        display: block;
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: var(--size-small);
      }

      .label-row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: var(--size-medium);
      }

      label {
        font-size: var(--font-small);
        font-weight: 600;
        color: var(--color-primary-text);
      }

      .helper {
        font-size: var(--font-tiny);
        color: var(--color-primary-text-muted);
      }

      .search-shell {
        position: relative;
      }

      .search-wrapper {
        display: flex;
        align-items: center;
        gap: 10px;
        background: var(--color-primary-surface-raised);
        border: var(--border-normal);
        border-radius: var(--border-radius-medium);
        padding: 10px 16px;
        transition: var(--transition-fast);
      }

      .search-wrapper:focus-within {
        border-color: var(--color-1);
        box-shadow: var(--shadow-glow);
      }

      .search-icon {
        color: var(--color-primary-text-muted);
        display: flex;
        flex-shrink: 0;
      }

      input {
        width: 100%;
        background: none;
        border: none;
        outline: none;
        color: var(--color-primary-text);
        font-size: var(--font-medium);
        font-family: var(--font-family);
      }

      input::placeholder {
        color: var(--color-primary-text-muted);
      }

      .results {
        position: absolute;
        inset: calc(100% + 6px) 0 auto;
        z-index: 20;
        background: var(--color-primary-surface-raised);
        border: var(--border-normal);
        border-radius: var(--border-radius-medium);
        box-shadow: var(--shadow-active);
        overflow: hidden;
      }

      .result-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: var(--size-small);
        padding: var(--size-medium);
        border-bottom: 1px solid rgba(201, 168, 76, 0.08);
      }

      .result-row:last-child {
        border-bottom: none;
      }

      .result-row.active,
      .result-row:hover {
        background: rgba(201, 168, 76, 0.08);
      }

      .result-main {
        min-width: 0;
      }

      .result-meta {
        font-size: var(--font-tiny);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--color-primary-text-muted);
        margin-bottom: 6px;
      }

      .result-title {
        font-size: var(--font-small);
        font-weight: 600;
        color: var(--color-primary-text);
        margin-bottom: 4px;
      }

      .result-excerpt {
        font-size: var(--font-tiny);
        color: var(--color-primary-text-muted);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .result-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-end;
      }

      .result-btn,
      .result-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 84px;
        padding: 8px 10px;
        border-radius: var(--border-radius-small);
        border: var(--border-normal);
        background: transparent;
        color: var(--color-primary-text);
        cursor: pointer;
        text-decoration: none;
        font-size: var(--font-tiny);
        transition: var(--transition-fast);
      }

      .result-btn:hover,
      .result-link:hover {
        border-color: rgba(201, 168, 76, 0.35);
        color: var(--color-1);
      }

      .selected-list {
        display: grid;
        gap: var(--size-small);
      }

      .empty {
        padding: var(--size-medium);
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
      }

      @media (max-width: 700px) {
        .result-row {
          grid-template-columns: 1fr;
        }

        .result-actions {
          flex-direction: row;
          justify-content: flex-start;
        }
      }
    `,
  ];

  @property({ type: String }) label = "";
  @property({ type: String }) placeholder = "Search…";
  @property({ type: String }) helper = "";
  @property({ type: Boolean }) multiple = false;
  @property({ attribute: false }) entries: SearchIndexedEntry[] = [];
  @property({ attribute: false }) selected: CharacterContentLink[] = [];
  @property({ type: Number }) maxResults = 6;

  @state() private query = "";
  @state() private activeIndex = -1;
  @state() private showResults = false;

  override render(): TemplateResult {
    const results = this.filteredEntries;

    return html`
      <div class="field">
        <div class="label-row">
          <label>${this.label}</label>
          ${this.helper
            ? html`
                <span class="helper">${this.helper}</span>
              `
            : nothing}
        </div>

        <div class="search-shell">
          <div class="search-wrapper">
            <span class="search-icon">${searchIcon}</span>
            <input
              type="text"
              .value=${this.query}
              placeholder=${this.placeholder}
              @input=${this.handleInput}
              @keydown=${this.handleKeyDown}
              @focus=${this.handleFocus}
              @blur=${this.handleBlur} />
          </div>

          ${this.showResults
            ? html`
                <div class="results" role="listbox">
                  ${results.length === 0
                    ? html`
                        <div class="empty">No matching entries.</div>
                      `
                    : results.map(
                        (entry, index) => html`
                          <div class="result-row ${this.activeIndex === index ? "active" : ""}">
                            <div class="result-main">
                              <div class="result-meta">
                                ${entry.categoryName}${entry.subcategory
                                  ? html`
                                      • ${entry.subcategory}
                                    `
                                  : nothing}
                              </div>
                              <div class="result-title">${entry.title}</div>
                              ${entry.contentText
                                ? html`
                                    <div class="result-excerpt">${this.toExcerpt(entry.contentText)}</div>
                                  `
                                : nothing}
                            </div>
                            <div class="result-actions">
                              <button class="result-btn" type="button" @mousedown=${() => this.selectEntry(entry)}>
                                ${this.multiple ? "Add" : "Choose"}
                              </button>
                              <a class="result-link" href="/${entry.categoryId}/${entry.slug}">Open</a>
                            </div>
                          </div>
                        `,
                      )}
                </div>
              `
            : nothing}
        </div>

        ${this.selected.length > 0
          ? html`
              <div class="selected-list">
                ${this.selected.map(
                  (selection) => html`
                    <character-linked-entry-card
                      .selection=${selection}
                      .removable=${true}
                      @remove-selection=${this.handleRemoveSelection}></character-linked-entry-card>
                  `,
                )}
              </div>
            `
          : nothing}
      </div>
    `;
  }

  private get filteredEntries(): SearchIndexedEntry[] {
    const selectedIds = new Set(this.selected.map((selection) => `${selection.categoryId}:${selection.slug}`));
    const candidates = this.entries.filter((entry) => {
      if (this.multiple) {
        return !selectedIds.has(`${entry.categoryId}:${entry.slug}`);
      }
      return true;
    });

    const query = this.query.trim();
    if (!query) {
      return [...candidates]
        .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title))
        .slice(0, this.maxResults);
    }

    return candidates
      .map((entry) => ({ entry, score: scoreSearchEntry(query, entry) }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score || left.entry.order - right.entry.order)
      .slice(0, this.maxResults)
      .map((item) => item.entry);
  }

  private handleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.query = input.value;
    this.activeIndex = -1;
    this.showResults = true;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.showResults && ["ArrowDown", "ArrowUp"].includes(event.key)) {
      this.showResults = true;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.activeIndex = Math.min(this.activeIndex + 1, this.filteredEntries.length - 1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      this.activeIndex = Math.max(this.activeIndex - 1, -1);
      return;
    }

    if (event.key === "Enter") {
      if (this.activeIndex >= 0 && this.activeIndex < this.filteredEntries.length) {
        event.preventDefault();
        this.selectEntry(this.filteredEntries[this.activeIndex]);
      }
      return;
    }

    if (event.key === "Escape") {
      this.showResults = false;
      this.activeIndex = -1;
    }
  }

  private handleFocus(): void {
    this.showResults = true;
  }

  private handleBlur(): void {
    setTimeout(() => {
      this.showResults = false;
      this.activeIndex = -1;
    }, 120);
  }

  private selectEntry(entry: SearchIndexedEntry): void {
    const link = createCharacterContentLink({
      id: entry.id,
      title: entry.title,
      slug: entry.slug,
      categoryId: entry.categoryId,
      categoryName: entry.categoryName,
      subcategory: entry.subcategory ?? null,
      heroImage: entry.heroImage,
      excerpt: this.toExcerpt(entry.contentText ?? ""),
    });

    const value = this.multiple ? [...this.selected, link] : [link];
    this.query = "";
    this.activeIndex = -1;
    this.showResults = false;
    this.dispatchSelectionChange(value);
  }

  private handleRemoveSelection(event: CustomEvent<{ selection: CharacterContentLink }>): void {
    const next = this.selected.filter(
      (selection) =>
        !(selection.categoryId === event.detail.selection.categoryId && selection.slug === event.detail.selection.slug),
    );
    this.dispatchSelectionChange(next);
  }

  private dispatchSelectionChange(value: CharacterContentLink[]): void {
    this.dispatchEvent(
      new CustomEvent("selection-change", {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private toExcerpt(value: string): string {
    return value.replace(/\s+/g, " ").trim().slice(0, 180);
  }
}
