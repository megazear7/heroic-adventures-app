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
      padding: var(--size-xl) var(--size-md);
      min-height: 100vh;
      background: var(--color-primary-surface);
    }
    h1 {
      font-family: var(--font-family-display);
      font-size: var(--size-1-75);
      color: var(--color-1);
      margin: 0 0 var(--size-2xs);
    }
    .subtitle {
      font-size: var(--size-0-875);
      color: var(--color-primary-text-muted);
      margin: 0 0 var(--size-xl);
    }
    .section-title {
      font-size: var(--size-md);
      font-weight: 600;
      color: var(--color-primary-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: var(--size-2xl) 0 var(--size-sm);
    }
    .logs-list {
      display: flex;
      flex-direction: column;
      gap: var(--size-md);
    }
    .empty {
      color: var(--color-primary-text-muted);
      font-size: var(--size-0-9);
      padding: var(--size-xs) 0;
    }
    @media (max-width: 600px) {
      :host {
        padding: var(--size-sm) var(--size-2xs);
      }
      h1 {
        font-size: var(--size-1-4);
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
