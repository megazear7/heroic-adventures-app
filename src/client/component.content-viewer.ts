import { html, css, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

@customElement("heroic-content-viewer")
export class HeroicContentViewer extends LitElement {
  static override styles = [
    css`
      :host {
        display: block;
        color: var(--color-primary-text);
        font-family: var(--font-family);
        font-size: var(--font-medium);
        line-height: var(--line-height);
      }

      .content-wrapper h1 {
        font-family: var(--font-family-display);
        font-size: var(--font-xl);
        color: var(--color-primary-text-bold);
        margin: 0 0 1rem 0;
      }

      .content-wrapper h2 {
        font-family: var(--font-family-display);
        font-size: var(--font-large);
        color: var(--color-primary-text-bold);
        margin: 2rem 0 0.75rem 0;
        padding-bottom: 4px;
        border-bottom: 1px solid rgba(201, 168, 76, 0.15);
      }

      .content-wrapper h3 {
        font-size: 18px;
        font-weight: 600;
        color: var(--color-primary-text);
        margin: 1.5rem 0 0.5rem 0;
      }

      .content-wrapper h4,
      .content-wrapper h5,
      .content-wrapper h6 {
        font-weight: 600;
        margin: 1rem 0 0.5rem 0;
      }

      .content-wrapper p {
        margin: 0 0 1rem 0;
      }

      .content-wrapper ul,
      .content-wrapper ol {
        padding-left: 1.5rem;
        margin: 0 0 1rem 0;
      }

      .content-wrapper li {
        margin-bottom: 0.3rem;
      }

      .content-wrapper blockquote {
        border-left: 3px solid var(--color-1);
        margin: 1rem 0;
        padding: 0.5rem 1rem;
        color: var(--color-primary-text-muted);
        background: var(--color-primary-surface-overlay);
        border-radius: 0 var(--border-radius-small) var(--border-radius-small) 0;
      }

      .content-wrapper table {
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0;
        font-size: var(--font-small);
      }

      .content-wrapper th,
      .content-wrapper td {
        border: 1px solid rgba(201, 168, 76, 0.15);
        padding: 8px 12px;
        text-align: left;
      }

      .content-wrapper th {
        background: var(--color-primary-surface-overlay);
        font-weight: 600;
        color: var(--color-1);
      }

      .content-wrapper tr:nth-child(even) {
        background: var(--color-primary-surface-raised);
      }

      .content-wrapper a {
        color: var(--color-2);
        text-decoration: none;
        transition: color var(--time-fast) ease;
      }

      .content-wrapper a:hover {
        color: var(--color-1);
      }

      .content-wrapper img,
      .content-wrapper .content-image {
        max-width: 100%;
        height: auto;
        border-radius: var(--border-radius-small);
        margin: 1rem 0;
      }

      .content-wrapper hr {
        border: none;
        border-top: 1px solid rgba(201, 168, 76, 0.15);
        margin: 2rem 0;
      }

      .content-wrapper code {
        background: var(--color-primary-surface-overlay);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.9em;
      }

      .content-wrapper strong {
        color: var(--color-primary-text);
        font-weight: 600;
      }

      .content-wrapper em {
        font-style: italic;
      }

      .loading {
        text-align: center;
        padding: 2rem;
        color: var(--color-primary-text-muted);
      }

      .loading-spinner {
        display: inline-block;
        width: 24px;
        height: 24px;
        border: 2px solid rgba(201, 168, 76, 0.2);
        border-top-color: var(--color-1);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ];

  @property({ type: String }) contentHtml = "";
  @property({ type: Boolean }) loading = false;

  override render(): TemplateResult {
    if (this.loading) {
      return html`
        <div class="loading">
          <div class="loading-spinner"></div>
        </div>
      `;
    }
    return html`
      <div class="content-wrapper">${unsafeHTML(this.contentHtml)}</div>
    `;
  }
}
