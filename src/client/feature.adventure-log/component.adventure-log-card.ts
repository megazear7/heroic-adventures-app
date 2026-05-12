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
      padding: 1.25rem;
      background: var(--color-primary-surface-raised, #16162a);
      border: 1px solid rgba(201, 168, 76, 0.15);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    .header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 0.5rem;
    }
    h2 {
      margin: 0;
      font-size: 1.25rem;
      color: var(--color-1, #c9a84c);
    }
    .session-badge {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-primary-text-muted, #8a8780);
      background: var(--color-primary-surface-overlay, #1e1e38);
      padding: 2px 10px;
      border-radius: 10px;
      white-space: nowrap;
    }
    .date {
      font-size: 0.8rem;
      color: var(--color-primary-text-muted, #8a8780);
      margin-bottom: 0.75rem;
    }
    .summary {
      font-size: 0.95rem;
      color: var(--color-primary-text, #e2e0d6);
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 0.75rem;
    }
    .tag {
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 8px;
      background: rgba(201, 168, 76, 0.12);
      color: var(--color-1, #c9a84c);
      border: 1px solid rgba(201, 168, 76, 0.2);
    }
    @media (max-width: 600px) {
      :host {
        padding: 0.75rem;
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
