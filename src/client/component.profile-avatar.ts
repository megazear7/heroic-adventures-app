import { html, css, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("heroic-profile-avatar")
export class HeroicProfileAvatar extends LitElement {
  static override styles = [
    css`
      :host {
        display: inline-flex;
      }

      .avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-weight: 700;
        font-family: var(--font-family-display, sans-serif);
        letter-spacing: 0.04em;
        user-select: none;
        flex-shrink: 0;
      }
    `,
  ];

  @property({ type: String }) initials = "";
  @property({ type: String }) color1 = "#c9a84c";
  @property({ type: String }) color2 = "#5b8a72";
  @property({ type: Number }) size = 32;

  override render(): TemplateResult {
    const fontSize = Math.round(this.size * 0.4);
    return html`
      <div
        class="avatar"
        style="
          width: ${this.size}px;
          height: ${this.size}px;
          font-size: ${fontSize}px;
          background: linear-gradient(135deg, ${this.color1}, ${this.color2});
          color: #fff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        ">
        ${this.initials}
      </div>
    `;
  }
}
