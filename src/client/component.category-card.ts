import { html, css, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { globalStyles } from "./styles.global.js";
import { chevronRightIcon } from "./icons.js";

@customElement("heroic-category-card")
export class HeroicCategoryCard extends LitElement {
  static override styles = [
    globalStyles,
    css`
      a {
        display: block;
        text-decoration: none;
        color: inherit;
      }

      .card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        min-height: 48px;
      }

      .card-body {
        flex: 1;
      }

      .card-title {
        font-family: var(--font-family-display);
        font-size: var(--font-medium);
        color: var(--color-primary-text);
        margin: 0 0 4px 0;
        font-weight: 600;
      }

      .card-count {
        font-size: var(--font-small);
        color: var(--color-primary-text-muted);
      }

      .card-arrow {
        color: var(--color-primary-text-muted);
        transition: var(--transition-fast);
      }

      .card:hover .card-arrow {
        color: var(--color-1);
        transform: translateX(4px);
      }

      .card:hover .card-title {
        color: var(--color-1);
      }
    `,
  ];

  @property({ type: String }) categoryId = "";
  @property({ type: String }) name = "";
  @property({ type: Number }) count = 0;

  override render(): TemplateResult {
    return html`
      <a href="/${this.categoryId}">
        <div class="card">
          <div class="card-body">
            <div class="card-title">${this.name}</div>
            <div class="card-count">${this.count} ${this.count === 1 ? "entry" : "entries"}</div>
          </div>
          <span class="card-arrow">${chevronRightIcon}</span>
        </div>
      </a>
    `;
  }
}
