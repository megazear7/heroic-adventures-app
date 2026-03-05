import { html, css, LitElement, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { globalStyles } from "./styles.global.js";
import { leftArrowIcon } from "./icons.js";

@customElement("heroic-not-found-page")
export class HeroicNotFoundPage extends LitElement {
  static override styles = [
    globalStyles,
    css`
      main {
        text-align: center;
        padding-top: 60px;
      }
      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--color-2);
        text-decoration: none;
        margin-top: 20px;
      }
      .back-link:hover {
        color: var(--color-1);
      }
    `,
  ];

  override render(): TemplateResult {
    return html`
      <main>
        <h1>Page Not Found</h1>
        <p class="muted">The scroll you seek is not in this library.</p>
        <a href="/" class="back-link">${leftArrowIcon} Return Home</a>
      </main>
    `;
  }
}
