import { html, css, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { globalStyles } from "./styles.global.js";
import { chevronRightIcon } from "./icons.js";

@customElement("heroic-category-card")
export class HeroicCategoryCard extends LitElement {
  static override styles = [
    globalStyles,
    css`
      .card-title {
        margin: 0 0 4px 0;
      }
    `,
  ];

  @property({ type: String }) categoryId = "";
  @property({ type: String }) name = "";
  @property({ type: Number }) count = 0;

  override render(): TemplateResult {
    return html`
      <a class="card-link" href="/${this.categoryId}">
        <div class="card card-row">
          <div class="card-row-body card-body">
            <div class="card-row-title card-title">${this.name}</div>
            <div class="card-row-count card-count">${this.count} ${this.count === 1 ? "entry" : "entries"}</div>
          </div>
          <span class="card-row-arrow card-arrow">${chevronRightIcon}</span>
        </div>
      </a>
    `;
  }
}
