import { html, css, LitElement, TemplateResult, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { globalStyles } from "./styles.global.js";
import { UserProfile, PROFILE_CHANGED_EVENT, getActiveProfile } from "../shared/service.profile.js";
import "./component.profile-avatar.js";

@customElement("heroic-profile-menu")
export class HeroicProfileMenu extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        position: relative;
        display: inline-flex;
        margin-left: auto;
      }

      .trigger {
        display: flex;
        align-items: center;
        gap: 8px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: var(--border-radius-small);
        transition: var(--transition-fast);
        color: var(--color-primary-text);
      }

      .trigger:hover {
        background: rgba(201, 168, 76, 0.08);
      }

      .trigger-name {
        font-size: 0.85rem;
        font-weight: 500;
        max-width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 6px;
        background: var(--color-primary-surface-raised);
        border: 1px solid rgba(201, 168, 76, 0.2);
        border-radius: var(--border-radius-small);
        box-shadow: var(--shadow-medium);
        z-index: 1001;
        min-width: 180px;
        overflow: hidden;
        animation: fadeIn 0.15s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .dropdown-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 16px;
        font-size: 0.85rem;
        color: var(--color-primary-text);
        cursor: pointer;
        transition: var(--transition-fast);
        border: none;
        background: none;
        width: 100%;
        text-align: left;
        font-family: var(--font-family);
      }

      .dropdown-item:hover {
        background: rgba(201, 168, 76, 0.08);
      }

      .dropdown-item svg {
        width: 16px;
        height: 16px;
        color: var(--color-primary-text-muted);
        flex-shrink: 0;
      }
    `,
  ];

  @property({ attribute: false }) profile: UserProfile | null = null;
  @state() private dropdownOpen = false;

  private onProfileChanged = (): void => {
    this.profile = getActiveProfile();
  };

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener(PROFILE_CHANGED_EVENT, this.onProfileChanged);
    document.addEventListener("click", this.handleDocumentClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(PROFILE_CHANGED_EVENT, this.onProfileChanged);
    document.removeEventListener("click", this.handleDocumentClick);
  }

  private handleDocumentClick = (e: Event): void => {
    if (this.dropdownOpen && !e.composedPath().includes(this)) {
      this.dropdownOpen = false;
    }
  };

  override render(): TemplateResult | typeof nothing {
    if (!this.profile) return nothing;

    return html`
      <button class="trigger" @click=${this.toggleDropdown}>
        <heroic-profile-avatar
          initials=${this.profile.initials}
          color1=${this.profile.color1}
          color2=${this.profile.color2}
          size=${28}></heroic-profile-avatar>
        <span class="trigger-name">${this.profile.name}</span>
      </button>

      ${this.dropdownOpen
        ? html`
            <div class="dropdown">
              <button class="dropdown-item" @click=${this.handleSettings}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.21,107.21,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.71,107.71,0,0,0-26.25-10.87,8,8,0,0,0-7.06,1.49L130.16,40.08q-2.16-.06-4.32,0L107.2,25.16a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.55a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40.08,125.84q-.06,2.16,0,4.32L25.16,148.8a8,8,0,0,0-1.48,7.06,107.21,107.21,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49l18.64-14.92q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.68l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187.11,168a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5.68-1.74,73.93,73.93,0,0,1-8.68,0,8,8,0,0,0-5.68,1.74L100.2,210.94a91.57,91.57,0,0,1-15-6.23L82.69,182.13a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64l-22.58-2.51a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.68,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.68L40.08,95.06a91.57,91.57,0,0,1,6.23-15L68.89,82.69a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.77,68.8l2.51-22.58a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.68,1.74,73.93,73.93,0,0,1,8.68,0,8,8,0,0,0,5.68-1.74l17.74-14.19a91.57,91.57,0,0,1,15,6.23l2.51,22.58a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z"></path>
                </svg>
                Settings
              </button>
              <button class="dropdown-item" @click=${this.handleSwitchUser}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z"></path>
                </svg>
                Switch Profile
              </button>
            </div>
          `
        : nothing}
    `;
  }

  private toggleDropdown(e: Event): void {
    e.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  private handleSettings(): void {
    this.dropdownOpen = false;
    this.dispatchEvent(
      new CustomEvent("NavigationEvent", {
        bubbles: true,
        composed: true,
        detail: { path: "/settings" },
      }),
    );
  }

  private handleSwitchUser(): void {
    this.dropdownOpen = false;
    this.dispatchEvent(
      new CustomEvent("profile-switch-request", {
        bubbles: true,
        composed: true,
      }),
    );
  }
}
