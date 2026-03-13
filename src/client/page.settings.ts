import { css, html, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import { globalStyles } from "./styles.global.js";
import { HeroicAppProvider } from "./provider.app.js";
import { AppContext, appContext } from "./context.js";
import {
  getActiveProfile,
  updateProfile,
  deleteProfile,
  AVATAR_COLORS,
  UserProfile,
} from "../shared/service.profile.js";
import { leftArrowIcon } from "./icons.js";
import "./component.profile-avatar.js";

@customElement("heroic-settings-page")
export class HeroicSettingsPage extends HeroicAppProvider {
  @consume({ context: appContext, subscribe: true })
  @property({ attribute: false })
  override appContext!: AppContext;

  @state() private profile: UserProfile | null = null;
  @state() private name = "";
  @state() private color1 = "";
  @state() private color2 = "";
  @state() private showDeleteConfirm = false;

  static override styles = [
    globalStyles,
    css`
      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--color-primary-text-muted);
        text-decoration: none;
        font-size: var(--font-small);
        transition: var(--transition-fast);
        margin-bottom: 20px;
      }

      .back-link:hover {
        color: var(--color-1);
      }

      .settings-card {
        background: var(--color-primary-surface-raised);
        border: var(--border-normal);
        border-radius: var(--border-radius-medium);
        padding: 28px;
        max-width: 480px;
      }

      .preview {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 28px;
        padding-bottom: 20px;
        border-bottom: 1px solid rgba(201, 168, 76, 0.1);
      }

      .preview-info {
        font-size: var(--font-medium);
        color: var(--color-primary-text);
        font-weight: 500;
      }

      .form-group {
        margin-bottom: 20px;
      }

      label {
        display: block;
        font-size: var(--font-small);
        color: var(--color-primary-text-muted);
        margin-bottom: 6px;
      }

      input[type="text"] {
        width: 100%;
        padding: 10px 14px;
        background: var(--color-primary-surface-overlay);
        border: 1px solid rgba(201, 168, 76, 0.15);
        border-radius: var(--border-radius-small);
        color: var(--color-primary-text);
        font-family: var(--font-family);
        font-size: var(--font-medium);
        outline: none;
        transition: var(--transition-fast);
        box-sizing: border-box;
      }

      input[type="text"]:focus {
        border-color: var(--color-1);
        box-shadow: var(--shadow-glow);
      }

      .color-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .color-swatch {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid transparent;
        cursor: pointer;
        transition: var(--transition-fast);
      }

      .color-swatch:hover {
        transform: scale(1.15);
      }

      .color-swatch.selected {
        border-color: #fff;
        box-shadow: 0 0 0 2px var(--color-1);
      }

      .actions {
        display: flex;
        gap: 10px;
        margin-top: 28px;
      }

      .danger-zone {
        margin-top: 32px;
        padding-top: 20px;
        border-top: 1px solid rgba(201, 168, 76, 0.1);
      }

      .danger-title {
        font-size: var(--font-small);
        color: var(--color-primary-text-muted);
        margin-bottom: 10px;
      }

      .btn-danger {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: var(--border-radius-small);
        border: 1px solid #c0392b;
        background: transparent;
        color: #c0392b;
        font-family: var(--font-family);
        font-size: var(--font-small);
        font-weight: 500;
        cursor: pointer;
        transition: var(--transition-fast);
      }

      .btn-danger:hover {
        background: #c0392b;
        color: #fff;
      }

      .confirm-delete {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 10px;
        font-size: var(--font-small);
        color: var(--color-primary-text-muted);
      }
    `,
  ];

  override async load(): Promise<void> {
    await super.load();
    this.profile = getActiveProfile();
    if (this.profile) {
      this.name = this.profile.name;
      this.color1 = this.profile.color1;
      this.color2 = this.profile.color2;
    }
  }

  override render(): TemplateResult {
    if (!this.profile) {
      return html`
        <main>
          <a href="/" class="back-link">${leftArrowIcon} Home</a>
          <h1>Settings</h1>
          <p class="muted">No active profile.</p>
        </main>
      `;
    }

    return html`
      <main>
        <a href="/" class="back-link">${leftArrowIcon} Home</a>
        <h1>Settings</h1>

        <div class="settings-card">
          <div class="preview">
            <heroic-profile-avatar
              initials=${this.deriveInitials(this.name || this.profile.name)}
              color1=${this.color1}
              color2=${this.color2}
              size=${56}></heroic-profile-avatar>
            <span class="preview-info">${this.name || this.profile.name}</span>
          </div>

          <div class="form-group">
            <label for="settings-name">Name</label>
            <input
              id="settings-name"
              type="text"
              .value=${this.name}
              @input=${(e: Event) => (this.name = (e.target as HTMLInputElement).value)} />
          </div>

          <div class="form-group">
            <label>Color 1</label>
            <div class="color-grid">
              ${AVATAR_COLORS.map(
                (c) => html`
                  <div
                    class="color-swatch ${c === this.color1 ? "selected" : ""}"
                    style="background: ${c}"
                    @click=${() => (this.color1 = c)}></div>
                `,
              )}
            </div>
          </div>

          <div class="form-group">
            <label>Color 2</label>
            <div class="color-grid">
              ${AVATAR_COLORS.map(
                (c) => html`
                  <div
                    class="color-swatch ${c === this.color2 ? "selected" : ""}"
                    style="background: ${c}"
                    @click=${() => (this.color2 = c)}></div>
                `,
              )}
            </div>
          </div>

          <div class="actions">
            <button class="btn btn-primary" @click=${this.handleSave} ?disabled=${!this.name.trim()}>
              Save Changes
            </button>
          </div>

          <div class="danger-zone">
            <div class="danger-title">Danger Zone</div>
            ${this.showDeleteConfirm
              ? html`
                  <div class="confirm-delete">
                    <span>Are you sure? This will delete all your favorites and pins.</span>
                    <button class="btn-danger" @click=${this.handleDelete}>Yes, Delete</button>
                    <button class="btn" @click=${() => (this.showDeleteConfirm = false)}>Cancel</button>
                  </div>
                `
              : html`
                  <button class="btn-danger" @click=${() => (this.showDeleteConfirm = true)}>
                    Delete Profile
                  </button>
                `}
          </div>
        </div>
      </main>
    `;
  }

  private deriveInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.trim().substring(0, 2).toUpperCase();
  }

  private handleSave(): void {
    if (!this.profile || !this.name.trim()) return;
    updateProfile(this.profile.id, {
      name: this.name,
      color1: this.color1,
      color2: this.color2,
    });
    this.profile = getActiveProfile();
  }

  private handleDelete(): void {
    if (!this.profile) return;
    deleteProfile(this.profile.id);
    this.dispatchEvent(
      new CustomEvent("NavigationEvent", {
        bubbles: true,
        composed: true,
        detail: { path: "/" },
      }),
    );
  }
}
