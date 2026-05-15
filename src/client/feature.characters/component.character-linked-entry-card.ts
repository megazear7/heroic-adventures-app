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
        grid-template-columns: auto 1fr auto;
        gap: var(--size-medium);
        align-items: start;
        padding: var(--size-medium);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(201, 168, 76, 0.04));
        border: var(--border-normal);
        border-radius: var(--border-radius-medium);
        transition: var(--transition-all);
      }

      .preview-card:hover,
      .preview-card:focus-within {
        border-color: rgba(201, 168, 76, 0.3);
        box-shadow: var(--shadow-glow);
        transform: translateY(-1px);
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
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: var(--font-tiny);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--color-primary-text-muted);
        margin-bottom: 6px;
      }

      .title,
      .title-link {
        font-family: var(--font-family-display);
        font-size: var(--font-medium);
        color: var(--color-primary-text);
        text-decoration: none;
      }

      .title-link:hover {
        color: var(--color-1);
      }

      .excerpt {
        margin: 8px 0 0;
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
        line-height: 1.45;
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        transition:
          max-height var(--time-normal) ease,
          opacity var(--time-normal) ease;
      }

      .preview-card:hover .excerpt,
      .preview-card:focus-within .excerpt,
      .preview-card.expanded .excerpt {
        max-height: 120px;
        opacity: 1;
      }

      .actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-end;
      }

      .mini-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 88px;
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

      .mini-btn:hover {
        border-color: rgba(201, 168, 76, 0.35);
        color: var(--color-1);
      }

      @media (max-width: 700px) {
        .preview-card {
          grid-template-columns: auto 1fr;
        }

        .actions {
          grid-column: 1 / -1;
          flex-direction: row;
          justify-content: flex-start;
        }
      }
    `,
  ];

  @property({ attribute: false }) selection: CharacterContentLink | null = null;
  @property({ type: Boolean }) removable = false;
  @property({ type: Boolean }) expanded = false;

  override render(): TemplateResult {
    if (!this.selection) {
      return html``;
    }

    const href = this.selection.slug ? `/${this.selection.categoryId}/${this.selection.slug}` : "";
    const fallbackBadge = this.selection.categoryName.slice(0, 2).toUpperCase();

    return html`
      <div class="preview-card ${this.expanded ? "expanded" : ""}">
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
          ${this.selection.excerpt
            ? html`
                <p class="excerpt">${this.selection.excerpt}</p>
              `
            : nothing}
        </div>
        <div class="actions">
          ${href
            ? html`
                <a class="mini-btn" href="${href}">Open Page</a>
              `
            : nothing}
          ${this.removable
            ? html`
                <button class="mini-btn" type="button" @click=${this.handleRemove}>Remove</button>
              `
            : nothing}
        </div>
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
