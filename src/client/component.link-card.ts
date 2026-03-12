import { html, css, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { globalStyles } from "./styles.global.js";
import { chevronRightIcon } from "./icons.js";

@customElement("heroic-link-card")
export class HeroicLinkCard extends LitElement {
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
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
      }

      .card-icon {
        display: flex;
        align-items: center;
        color: var(--color-1);
      }

      .card-icon svg {
        width: 20px;
        height: 20px;
      }

      .card-title {
        font-family: var(--font-family-display);
        font-size: var(--font-medium);
        color: var(--color-primary-text);
        margin: 0;
        font-weight: 600;
      }

      .card-count {
        font-size: var(--font-small);
        color: var(--color-primary-text-muted);
        margin-left: auto;
        margin-right: 12px;
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

  @property({ type: String }) href = "";
  @property({ type: String }) label = "";
  @property({ type: Number }) count = 0;

  override render(): TemplateResult {
    return html`
      <a href="${this.href}">
        <div class="card">
          <div class="card-body">
            <span class="card-icon"><slot name="icon"></slot></span>
            <div class="card-title">${this.label}</div>
          </div>
          ${this.count > 0 ? html`<span class="card-count">${this.count}</span>` : ""}
          <span class="card-arrow">${chevronRightIcon}</span>
        </div>
      </a>
    `;
  }
}
