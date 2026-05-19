import { html, css, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { globalStyles } from "./styles.global.js";
import { chevronRightIcon } from "./icons.js";

@customElement("heroic-link-card")
export class HeroicLinkCard extends LitElement {
  static override styles = [
    globalStyles,
    css`
      .card-row-body-icon {
        display: flex;
        align-items: center;
        gap: var(--size-small);
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

      .card-row-count-trailing {
        margin-left: auto;
        margin-right: var(--size-medium);
      }
    `,
  ];

  @property({ type: String }) href = "";
  @property({ type: String }) label = "";
  @property({ type: Number }) count = 0;

  override render(): TemplateResult {
    return html`
      <a class="card-link" href="${this.href}">
        <div class="card-surface card-row">
          <div class="card-row-body card-row-body-icon">
            <span class="card-icon"><slot name="icon"></slot></span>
            <div class="card-row-title card-title">${this.label}</div>
          </div>
          ${this.count > 0
            ? html`
                <span class="card-row-count card-row-count-trailing">${this.count}</span>
              `
            : ""}
          <span class="card-row-arrow card-arrow">${chevronRightIcon}</span>
        </div>
      </a>
    `;
  }
}
