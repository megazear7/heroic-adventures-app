import { html, css, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { globalStyles } from "./styles.global.js";

@customElement("heroic-entry-list-item")
export class HeroicEntryListItem extends LitElement {
  static override styles = [
    globalStyles,
    css`
      a {
        display: block;
        text-decoration: none !important;
        color: inherit;
      }

      .item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 14px 18px;
        background: var(--color-primary-surface-raised);
        border: var(--border-normal);
        border-radius: var(--border-radius-small);
        transition: var(--transition-all);
        cursor: pointer;
      }

      .item:hover {
        border-color: rgba(201, 168, 76, 0.35);
        box-shadow: var(--shadow-glow);
        transform: translateY(-1px);
      }

      .thumb {
        width: 48px;
        height: 48px;
        border-radius: var(--border-radius-small);
        object-fit: cover;
        background: var(--color-primary-surface-overlay);
        flex-shrink: 0;
      }

      .title {
        font-size: var(--font-medium);
        font-weight: 500;
        color: var(--color-primary-text);
        transition: color var(--time-fast) ease;
      }

      .item:hover .title {
        color: var(--color-1);
      }
    `,
  ];

  @property({ type: String }) entryTitle = "";
  @property({ type: String }) slug = "";
  @property({ type: String }) categoryId = "";
  @property({ type: String }) imageUrl = "";
  @property({ type: String }) imageAlt = "";

  override render(): TemplateResult {
    return html`
      <a href="/${this.categoryId}/${this.slug}">
        <div class="item">
          ${this.imageUrl
            ? html`
                <img class="thumb" src="${this.imageUrl}" alt="${this.imageAlt}" loading="lazy" />
              `
            : ""}
          <span class="title">${this.entryTitle}</span>
        </div>
      </a>
    `;
  }
}
