import { css, html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

export type HeroicToastAction = {
  label: string;
  eventName: string;
};

@customElement("heroic-toast")
export class HeroicToast extends LitElement {
  static override styles = css`
    .toast {
      position: fixed;
      bottom: var(--toast-bottom, var(--size-xl));
      left: 50%;
      transform: translateX(-50%);
      background: var(--toast-background, var(--color-1, #c9a84c));
      color: var(--toast-color, #1a1a2e);
      font-weight: 700;
      font-size: 0.9rem;
      padding: 0.6rem 1.5rem;
      border-radius: 24px;
      z-index: 9999;
      pointer-events: auto;
      animation: toastIn 200ms ease;
      display: grid;
      gap: 0.75rem;
      min-width: min(560px, calc(100vw - 2rem));
      max-width: calc(100vw - 2rem);
    }

    .message {
      line-height: 1.45;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .action {
      border: 1px solid rgba(26, 26, 46, 0.18);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.28);
      color: inherit;
      font: inherit;
      font-weight: 700;
      padding: 0.45rem 0.9rem;
      cursor: pointer;
    }

    .action:hover,
    .action:focus-visible {
      background: rgba(255, 255, 255, 0.42);
      outline: none;
    }

    @media (max-width: 640px) {
      .toast {
        min-width: auto;
      }

      .actions {
        flex-direction: column;
      }
    }

    @keyframes toastIn {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(8px);
      }

      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
  `;

  @property({ type: String }) message = "";
  @property({ attribute: false }) actions: HeroicToastAction[] = [];

  override render() {
    if (!this.message) return nothing;

    return html`
      <div class="toast" role="status" aria-live="polite">
        <div class="message">${this.message}</div>
        ${this.actions.length > 0
          ? html`
              <div class="actions">
                ${this.actions.map(
                  (action) => html`
                    <button class="action" type="button" @click=${() => this.handleAction(action.eventName)}>
                      ${action.label}
                    </button>
                  `,
                )}
              </div>
            `
          : nothing}
      </div>
    `;
  }

  private handleAction(eventName: string): void {
    this.dispatchEvent(
      new CustomEvent(eventName, {
        bubbles: true,
        composed: true,
      }),
    );
  }
}