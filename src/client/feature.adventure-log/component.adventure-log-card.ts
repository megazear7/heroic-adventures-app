import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { AdventureLog } from "../../shared/type.adventure-log";

@customElement("adventure-log-card")
export class AdventureLogCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
      max-width: 600px;
      margin: 0 auto;
      padding: var(--size-lg);
      background: var(--color-primary-surface-raised);
      border: 1px solid rgba(201, 168, 76, 0.15);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    .header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--size-md);
      flex-wrap: wrap;
      margin-bottom: var(--size-xs);
    }
    h2 {
      margin: 0;
      font-size: var(--size-lg);
      color: var(--color-1);
    }
    .session-badge {
      font-size: var(--size-sm);
      font-weight: 600;
      color: var(--color-primary-text-muted);
      background: var(--color-primary-surface-overlay);
      padding: 2px 10px;
      border-radius: 10px;
      white-space: nowrap;
    }
    .date {
      font-size: var(--size-0-8);
      color: var(--color-primary-text-muted);
      margin-bottom: var(--size-sm);
    }
    .summary {
      font-size: var(--size-0-95);
      color: var(--color-primary-text);
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: var(--size-sm);
    }
    .tag {
      font-size: var(--size-0-7);
      padding: 2px 8px;
      border-radius: 8px;
      background: rgba(201, 168, 76, 0.12);
      color: var(--color-1);
      border: 1px solid rgba(201, 168, 76, 0.2);
    }
    @media (max-width: 600px) {
      :host {
        padding: var(--size-sm);
        max-width: 100%;
        border-radius: 8px;
      }
    }
  `;

  @property({ type: Object }) log!: AdventureLog;

  override render() {
    if (!this.log) return html``;
    const l = this.log;
    return html`
      <div class="header">
        <h2>${l.title}</h2>
        <span class="session-badge">Session ${l.session}</span>
      </div>
      ${l.date
        ? html`
            <div class="date">${l.date}</div>
          `
        : ""}
      ${l.summary
        ? html`
            <div class="summary">${l.summary}</div>
          `
        : ""}
      ${l.tags.length > 0
        ? html`
            <div class="tags">
              ${l.tags.map(
                (t) => html`
                  <span class="tag">${t}</span>
                `,
              )}
            </div>
          `
        : ""}
    `;
  }
}
