import { html, css, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { globalStyles } from "./styles.global.js";
import { searchIcon } from "./icons.js";

@customElement("heroic-search-bar")
export class HeroicSearchBar extends LitElement {
  static override styles = [
    globalStyles,
    css`
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
    `,
  ];

  @property({ type: String }) value = "";
  @property({ type: String }) placeholder = "Search…";

  override render(): TemplateResult {
    return html`
      <div class="search-wrapper">
        <span class="search-icon">${searchIcon}</span>
        <input
          type="text"
          .value=${this.value}
          placeholder=${this.placeholder}
          @input=${this.handleInput}
          @keydown=${this.handleKeydown} />
      </div>
    `;
  }

  private handleInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.value = input.value;
    this.dispatchEvent(new CustomEvent("search-input", { detail: { value: this.value } }));
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter") {
      this.dispatchEvent(new CustomEvent("search-submit", { detail: { value: this.value } }));
    }
  }
}
