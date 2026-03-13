import { html, css, LitElement, TemplateResult, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { globalStyles } from "./styles.global.js";
import {
  getAllProfiles,
  createProfile,
  switchProfile,
  UserProfile,
} from "../shared/service.profile.js";
import "./component.profile-avatar.js";

@customElement("heroic-profile-modal")
export class HeroicProfileModal extends LitElement {
  static override styles = [
    globalStyles,
    css`
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease;
        padding: 20px;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .modal {
        background: var(--color-primary-surface-raised);
        border: 1px solid rgba(201, 168, 76, 0.2);
        border-radius: var(--border-radius-medium);
        padding: 32px;
        max-width: 400px;
        width: 100%;
        box-shadow: var(--shadow-medium);
        animation: slideUp 0.25s ease;
      }

      @keyframes slideUp {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }

      h2 {
        font-family: var(--font-family-display);
        color: var(--color-1);
        margin: 0 0 8px 0;
        font-size: var(--font-large);
      }

      .subtitle {
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
        margin-bottom: 24px;
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

      input {
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

      input:focus {
        border-color: var(--color-1);
        box-shadow: var(--shadow-glow);
      }

      .actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }

      .existing-profiles {
        margin-bottom: 24px;
      }

      .existing-label {
        font-size: var(--font-small);
        color: var(--color-primary-text-muted);
        margin-bottom: 10px;
      }

      .profile-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .profile-option {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        background: var(--color-primary-surface-overlay);
        border: 1px solid rgba(201, 168, 76, 0.1);
        border-radius: var(--border-radius-small);
        cursor: pointer;
        transition: var(--transition-fast);
      }

      .profile-option:hover {
        border-color: rgba(201, 168, 76, 0.35);
        box-shadow: var(--shadow-glow);
      }

      .profile-option-name {
        font-size: var(--font-medium);
        color: var(--color-primary-text);
        font-weight: 500;
      }

      .divider {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 20px 0;
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
      }

      .divider::before,
      .divider::after {
        content: "";
        flex: 1;
        border-top: 1px solid rgba(201, 168, 76, 0.1);
      }
    `,
  ];

  @property({ type: Boolean }) open = false;
  @property({ type: Boolean }) showExisting = false;

  @state() private name = "";
  @state() private profiles: UserProfile[] = [];

  override willUpdate(): void {
    if (this.open) {
      this.profiles = getAllProfiles();
    }
  }

  override render(): TemplateResult | typeof nothing {
    if (!this.open) return nothing;

    const existingProfiles = this.showExisting ? this.profiles : [];

    return html`
      <div class="overlay" @click=${this.handleOverlayClick}>
        <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
          <h2>${this.showExisting ? "Switch Profile" : "Welcome, Adventurer!"}</h2>
          <p class="subtitle">
            ${this.showExisting
              ? "Choose an existing profile or create a new one."
              : "Create a profile to get started."}
          </p>

          ${existingProfiles.length > 0
            ? html`
                <div class="existing-profiles">
                  <div class="existing-label">Existing profiles</div>
                  <div class="profile-list">
                    ${existingProfiles.map(
                      (p) => html`
                        <div class="profile-option" @click=${() => this.handleSelectProfile(p.id)}>
                          <heroic-profile-avatar
                            initials=${p.initials}
                            color1=${p.color1}
                            color2=${p.color2}
                            size=${36}></heroic-profile-avatar>
                          <span class="profile-option-name">${p.name}</span>
                        </div>
                      `,
                    )}
                  </div>
                  <div class="divider">or create new</div>
                </div>
              `
            : nothing}

          <div class="form-group">
            <label for="profile-name">Name</label>
            <input
              id="profile-name"
              type="text"
              placeholder="Enter your name"
              .value=${this.name}
              @input=${(e: Event) => (this.name = (e.target as HTMLInputElement).value)}
              @keydown=${this.handleKeydown} />
          </div>

          <div class="actions">
            ${this.showExisting
              ? html`<button class="btn" @click=${this.handleCancel}>Cancel</button>`
              : nothing}
            <button
              class="btn btn-primary"
              ?disabled=${!this.name.trim()}
              @click=${this.handleCreate}>
              Create Profile
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter" && this.name.trim()) {
      this.handleCreate();
    }
  }

  private handleCreate(): void {
    if (!this.name.trim()) return;
    createProfile(this.name);
    this.name = "";
    this.dispatchEvent(new CustomEvent("profile-created", { bubbles: true, composed: true }));
  }

  private handleSelectProfile(id: string): void {
    switchProfile(id);
    this.dispatchEvent(new CustomEvent("profile-switched", { bubbles: true, composed: true }));
  }

  private handleCancel(): void {
    this.dispatchEvent(new CustomEvent("profile-modal-close", { bubbles: true, composed: true }));
  }

  private handleOverlayClick(): void {
    if (this.showExisting) {
      this.handleCancel();
    }
  }
}
