import { css, html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

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
      pointer-events: none;
      animation: toastIn 200ms ease;
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

  override render() {
    if (!this.message) return nothing;

    return html`
      <div class="toast" role="status" aria-live="polite">${this.message}</div>
    `;
  }
}