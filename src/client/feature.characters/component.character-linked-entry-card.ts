import { css, html, LitElement, nothing, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { globalStyles } from "../styles.global.js";
import { CharacterContentLink } from "../../shared/type.character.js";

@customElement("character-linked-entry-card")
export class CharacterLinkedEntryCard extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        display: block;
      }

      .preview-card {
        display: grid;
        grid-template-columns: auto 1fr;
        position: relative;
        gap: var(--size-medium);
        align-items: start;
        padding: var(--size-medium);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(201, 168, 76, 0.04));
        border: var(--border-normal);
        border-radius: var(--border-radius-medium);
        transition: border-color var(--time-fast) ease;
      }

      .media {
        width: var(--size-2x);
        height: var(--size-2x);
        border-radius: var(--border-radius-small);
        background: var(--color-primary-surface-overlay);
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-primary-text-muted);
        font-size: var(--font-tiny);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .media img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .body {
        min-width: 0;
        display: grid;
        gap: 8px;
      }

      .row-main {
        display: flex;
        align-items: flex-start;
        gap: var(--size-small);
        flex-wrap: wrap;
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: var(--font-tiny);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--color-primary-text-muted);
      }

      .title,
      .title-link {
        font-family: var(--font-family-display);
        font-size: var(--font-small);
        color: var(--color-primary-text);
        text-decoration: none;
        min-width: 0;
      }

      .title-link:hover {
        color: var(--color-1);
      }

      .excerpt {
        grid-column: 1 / -1;
        margin: 0;
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
        line-height: 1.45;
      }

      .remove-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: none;
        background: transparent;
        color: var(--color-primary-text);
        cursor: pointer;
        font-size: var(--font-large);
        line-height: 1;
        transition:
          color var(--time-fast) ease,
          opacity var(--time-fast) ease;
        opacity: 0;
        pointer-events: none;
      }

      .preview-card:hover .remove-btn,
      .preview-card:focus-within .remove-btn {
        opacity: 1;
        pointer-events: auto;
      }

      .remove-btn:hover {
        color: var(--color-1);
      }
    `,
  ];

  @property({ attribute: false }) selection: CharacterContentLink | null = null;
  @property({ type: Boolean }) removable = false;

  override render(): TemplateResult {
    if (!this.selection) {
      return html``;
    }

    const href = this.selection.slug ? `/${this.selection.categoryId}/${this.selection.slug}` : "";
    const fallbackBadge = this.selection.categoryName.slice(0, 2).toUpperCase();

    return html`
      <div class="preview-card">
        <div class="media">
          ${this.selection.heroImage
            ? html`
                <img src="${this.selection.heroImage.url}" alt="${this.selection.heroImage.alt}" loading="lazy" />
              `
            : html`
                ${fallbackBadge}
              `}
        </div>
        <div class="body">
          <div class="row-main">
            <div class="eyebrow">
              <span>${this.selection.categoryName}</span>
              ${this.selection.subcategory
                ? html`
                    <span>• ${this.selection.subcategory}</span>
                  `
                : nothing}
            </div>
            ${href
              ? html`
                  <a class="title-link" href="${href}">${this.selection.title}</a>
                `
              : html`
                  <div class="title">${this.selection.title}</div>
                `}
          </div>
          ${this.selection.excerpt
            ? html`
                <p class="excerpt">${this.selection.excerpt}</p>
              `
            : nothing}
        </div>
        ${this.removable
          ? html`
              <button
                class="remove-btn"
                type="button"
                @click=${this.handleRemove}
                aria-label="Remove selection"
                title="Remove selection">
                ×
              </button>
            `
          : nothing}
      </div>
    `;
  }

  private handleRemove(): void {
    if (!this.selection) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent("remove-selection", {
        detail: { selection: this.selection },
        bubbles: true,
        composed: true,
      }),
    );
  }
}
