import { html, css, LitElement, TemplateResult, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { globalStyles } from "./styles.global.js";
import { searchIcon } from "./icons.js";

export interface SearchSuggestion {
  title: string;
  href: string;
  imageUrl?: string;
  imageAlt?: string;
  categoryName?: string;
}

@customElement("heroic-search-bar")
export class HeroicSearchBar extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        display: block;
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
        flex-shrink: 0;
        display: flex;
      }

      input {
        flex: 1;
        background: none;
        border: none;
        color: var(--color-primary-text);
        font-family: var(--font-family);
        font-size: var(--font-medium);
        outline: none;
      }

      input::placeholder {
        color: var(--color-primary-text-muted);
      }

      .dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 4px;
        background: var(--color-primary-surface-raised);
        border: 1px solid rgba(201, 168, 76, 0.2);
        border-radius: var(--border-radius-small);
        box-shadow: var(--shadow-medium);
        z-index: 1000;
        overflow: hidden;
      }

      .dropdown-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        text-decoration: none;
        color: var(--color-primary-text);
        font-size: 0.85rem;
        transition: var(--transition-fast);
        cursor: pointer;
        border-bottom: 1px solid rgba(201, 168, 76, 0.06);
      }

      .dropdown-item:last-child {
        border-bottom: none;
      }

      .dropdown-item:hover,
      .dropdown-item.active {
        background: rgba(201, 168, 76, 0.08);
      }

      .dropdown-item img {
        width: 28px;
        height: 28px;
        border-radius: 4px;
        object-fit: cover;
        flex-shrink: 0;
      }

      .dropdown-item .suggestion-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: flex;
        align-items: baseline;
        gap: 8px;
        min-width: 0;
      }

      .dropdown-item .suggestion-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .dropdown-item .suggestion-category {
        font-size: 0.75rem;
        color: var(--color-primary-text-muted);
        white-space: nowrap;
        flex-shrink: 0;
      }
    `,
  ];

  @property({ type: String }) value = "";
  @property({ type: String }) placeholder = "Search…";
  @property({ type: Array }) suggestions: SearchSuggestion[] = [];

  @state() private showDropdown = false;
  @state() private activeIndex = -1;

  override render(): TemplateResult {
    return html`
      <div class="search-wrapper">
        <span class="search-icon">${searchIcon}</span>
        <input
          type="text"
          .value=${this.value}
          placeholder=${this.placeholder}
          @input=${this.handleInput}
          @keydown=${this.handleKeydown}
          @focus=${this.handleFocus}
          @blur=${this.handleBlur} />
      </div>
      ${this.showDropdown && this.suggestions.length > 0
        ? html`
            <div class="dropdown" role="listbox">
              ${this.suggestions.map(
                (s, i) => html`
                  <a
                    class="dropdown-item ${i === this.activeIndex ? "active" : ""}"
                    href="${s.href}"
                    role="option"
                    aria-selected=${i === this.activeIndex}
                    @mousedown=${(e: Event) => this.handleSuggestionClick(e, s)}>
                    ${s.imageUrl
                      ? html`<img src="${s.imageUrl}" alt="${s.imageAlt ?? ""}" />`
                      : nothing}
                    <span class="suggestion-text">
                      <span class="suggestion-title">${s.title}</span>
                      ${s.categoryName
                        ? html`<span class="suggestion-category">${s.categoryName}</span>`
                        : nothing}
                    </span>
                  </a>
                `,
              )}
            </div>
          `
        : nothing}
    `;
  }

  private handleInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.value = input.value;
    this.activeIndex = -1;
    this.showDropdown = true;
    this.dispatchEvent(new CustomEvent("search-input", { detail: { value: this.value } }));
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === "ArrowDown" && this.suggestions.length > 0) {
      e.preventDefault();
      this.activeIndex = Math.min(this.activeIndex + 1, this.suggestions.length - 1);
    } else if (e.key === "ArrowUp" && this.suggestions.length > 0) {
      e.preventDefault();
      this.activeIndex = Math.max(this.activeIndex - 1, -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (this.activeIndex >= 0 && this.activeIndex < this.suggestions.length) {
        const selected = this.suggestions[this.activeIndex];
        this.showDropdown = false;
        this.dispatchEvent(
          new CustomEvent("search-navigate", { detail: { href: selected.href } }),
        );
      } else {
        this.showDropdown = false;
        this.dispatchEvent(new CustomEvent("search-submit", { detail: { value: this.value } }));
      }
    } else if (e.key === "Escape") {
      this.showDropdown = false;
      this.activeIndex = -1;
    }
  }

  private handleFocus(): void {
    if (this.suggestions.length > 0) {
      this.showDropdown = true;
    }
  }

  private handleBlur(): void {
    // Delay to allow mousedown on dropdown items to fire first
    setTimeout(() => {
      this.showDropdown = false;
      this.activeIndex = -1;
    }, 150);
  }

  private handleSuggestionClick(e: Event, suggestion: SearchSuggestion): void {
    e.preventDefault();
    this.showDropdown = false;
    this.dispatchEvent(
      new CustomEvent("search-navigate", { detail: { href: suggestion.href } }),
    );
  }
}
