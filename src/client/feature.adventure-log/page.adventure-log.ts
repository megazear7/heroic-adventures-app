import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { AdventureLog } from "../../shared/type.adventure-log";
import "./component.adventure-log-create-form";
import "./component.adventure-log-card";

const STORAGE_KEY = "ha-adventure-logs";

@customElement("page-adventure-log")
export class PageAdventureLog extends LitElement {
  static override styles = css`
    :host {
      display: block;
      padding: 1.5rem 1rem;
      min-height: 100vh;
      background: var(--color-primary-surface, #0f0f1a);
    }
    h1 {
      font-family: var(--font-family-display, serif);
      font-size: 1.75rem;
      color: var(--color-1, #c9a84c);
      margin: 0 0 0.25rem;
    }
    .subtitle {
      font-size: 0.875rem;
      color: var(--color-primary-text-muted, #8a8780);
      margin: 0 0 1.5rem;
    }
    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-primary-text-muted, #8a8780);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 2rem 0 0.75rem;
    }
    .logs-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .empty {
      color: var(--color-primary-text-muted, #8a8780);
      font-size: 0.9rem;
      padding: 0.5rem 0;
    }
    @media (max-width: 600px) {
      :host {
        padding: 0.75rem 0.25rem;
      }
      h1 {
        font-size: 1.4rem;
      }
    }
  `;

  @state() private logs: AdventureLog[] = [];

  override connectedCallback() {
    super.connectedCallback();
    this.loadLogs();
  }

  private loadLogs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.logs = raw ? JSON.parse(raw) : [];
    } catch {
      this.logs = [];
    }
  }

  private saveLogs() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
  }

  private handleLogCreated(e: CustomEvent) {
    this.logs = [e.detail, ...this.logs];
    this.saveLogs();
  }

  override render() {
    return html`
      <h1>Adventure Log</h1>
      <p class="subtitle">
        Track your sessions and campaign history. All data is stored locally and available offline.
      </p>

      <adventure-log-create-form @log-created=${this.handleLogCreated}></adventure-log-create-form>

      <div class="section-title">Past Sessions</div>
      <div class="logs-list">
        ${this.logs.length === 0
          ? html`
              <p class="empty">No log entries yet. Add your first session above.</p>
            `
          : this.logs.map(
              (l) => html`
                <adventure-log-card .log=${l}></adventure-log-card>
              `,
            )}
      </div>
    `;
  }
}
