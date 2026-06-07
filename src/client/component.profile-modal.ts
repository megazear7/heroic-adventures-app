import { html, css, LitElement, TemplateResult, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { globalStyles } from "./styles.global.js";
import {
  getAllProfiles,
  createProfile,
  switchProfile,
  importProfileFromFileContent,
  UserProfile,
} from "../shared/service.profile.js";
import "./component.profile-avatar.js";

@customElement("heroic-profile-modal")
export class HeroicProfileModal extends LitElement {
  static override styles = [
    globalStyles,
    css`
      .overlay {
        --modal-overlay-bg: rgba(0, 0, 0, 0.7);
        animation: fadeIn 0.2s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .modal {
        --modal-max-width: 400px;
        --modal-border: 1px solid rgba(201, 168, 76, 0.2);
        --modal-padding: 32px;
        animation: slideUp 0.25s ease;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
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
        --form-input-border: 1px solid rgba(201, 168, 76, 0.15);
        --form-input-padding: 10px 14px;
      }

      .actions {
        --modal-actions-gap: 10px;
      }

      .existing-label {
        font-size: var(--font-small);
        color: var(--color-primary-text-muted);
        margin-bottom: 10px;
      }

      .existing-profiles {
        display: grid;
        gap: 8px;
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

      .profile-option-copy {
        display: block;
        margin-top: 4px;
        font-size: var(--font-small);
        color: var(--color-primary-text-muted);
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

      .import-panel {
        display: grid;
        gap: 16px;
      }

      .drop-zone {
        background: var(--color-primary-surface-overlay);
        border: 1px dashed rgba(201, 168, 76, 0.18);
        border-radius: var(--border-radius-small);
        padding: 18px;
        text-align: center;
        cursor: pointer;
        transition: var(--transition-fast);
      }

      .drop-zone.drag-active,
      .drop-zone:hover {
        border-color: rgba(201, 168, 76, 0.35);
        box-shadow: var(--shadow-glow);
      }

      .drop-zone-title {
        font-family: var(--font-family-display);
        font-size: var(--font-medium);
        color: var(--color-primary-text);
      }

      .drop-zone-copy {
        margin-top: 8px;
        font-size: var(--font-small);
        color: var(--color-primary-text-muted);
        line-height: 1.5;
      }

      .import-error {
        padding: 12px 14px;
        border-radius: var(--border-radius-small);
        border: 1px solid rgba(192, 57, 43, 0.4);
        background: rgba(192, 57, 43, 0.08);
        color: #f2b8b1;
        font-size: var(--font-small);
      }

      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `,
  ];

  @property({ type: Boolean }) open = false;
  @property({ type: Boolean }) showExisting = false;

  @state() private name = "";
  @state() private profiles: UserProfile[] = [];
  @state() private mode: "profiles" | "import" = "profiles";
  @state() private importError = "";
  @state() private importInProgress = false;
  @state() private importDragActive = false;

  @query("#profile-import-input") private importInput?: HTMLInputElement;

  override willUpdate(): void {
    if (this.open) {
      this.profiles = getAllProfiles();
      if (!this.showExisting) {
        this.mode = "profiles";
      }
    } else {
      this.resetImportState();
    }
  }

  override render(): TemplateResult | typeof nothing {
    if (!this.open) return nothing;

    const existingProfiles = this.showExisting ? this.profiles : [];
    const isImportMode = this.showExisting && this.mode === "import";

    return html`
      <div class="modal-overlay overlay" @click=${this.handleOverlayClick}>
        <div class="modal-surface modal" @click=${(e: Event) => e.stopPropagation()}>
          <h2>${isImportMode ? "Import Profile" : this.showExisting ? "Switch Profile" : "Welcome, Adventurer!"}</h2>
          <p class="subtitle">
            ${isImportMode
              ? "Create a new profile from an exported Heroic Adventures profile file. If the name already exists, a numbered suffix is added automatically."
              : this.showExisting
              ? "Choose an existing profile or create a new one."
              : "Create a profile to get started."}
          </p>

          ${isImportMode
            ? this.renderImportPanel()
            : existingProfiles.length > 0
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
                  <div class="divider">or import profile</div>
                  <button class="profile-option" @click=${this.handleOpenImport}>
                    <span>
                      <span class="profile-option-name">Import Profile</span>
                    </span>
                  </button>
                  <div class="divider">or create new</div>
                </div>
              `
            : nothing}

          ${isImportMode
            ? html`
                <div class="modal-actions actions">
                  <button class="btn" @click=${this.handleBackToProfiles}>Back</button>
                  <button class="btn btn-primary" @click=${this.openImportPicker} ?disabled=${this.importInProgress}>
                    Choose File
                  </button>
                </div>
              `
            : html`
                <div class="form-group">
                  <label for="profile-name">Name</label>
                  <input
                    class="form-input"
                    id="profile-name"
                    type="text"
                    placeholder="Enter your name"
                    .value=${this.name}
                    @input=${(e: Event) => (this.name = (e.target as HTMLInputElement).value)}
                    @keydown=${this.handleKeydown} />
                </div>

                <div class="modal-actions actions">
                  ${this.showExisting
                    ? html`
                        <button class="btn" @click=${this.handleCancel}>Cancel</button>
                      `
                    : nothing}
                  <button class="btn btn-primary" ?disabled=${!this.name.trim()} @click=${this.handleCreate}>
                    Create Profile
                  </button>
                </div>
              `}
        </div>
      </div>
    `;
  }

  private renderImportPanel(): TemplateResult {
    return html`
      <div class="import-panel">
        <input
          id="profile-import-input"
          class="visually-hidden"
          type="file"
          accept=".json,application/json"
          @change=${this.handleImportInputChange} />

        <div
          class="drop-zone ${this.importDragActive ? "drag-active" : ""}"
          @click=${this.openImportPicker}
          @dragenter=${this.handleImportDragEnter}
          @dragover=${this.handleImportDragOver}
          @dragleave=${this.handleImportDragLeave}
          @drop=${this.handleImportDrop}>
          <div class="drop-zone-title">Drop profile export here</div>
          <div class="drop-zone-copy">
            ${this.importInProgress
              ? "Importing profile..."
              : "Drag and drop a profile export JSON file here, or click to choose one from your device."}
          </div>
        </div>

        ${this.importError ? html`<div class="import-error">${this.importError}</div>` : nothing}
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

  private handleOpenImport = (): void => {
    this.mode = "import";
    this.resetImportState();
  };

  private handleBackToProfiles = (): void => {
    this.mode = "profiles";
    this.resetImportState();
  };

  private openImportPicker = (): void => {
    this.importInput?.click();
  };

  private handleImportInputChange = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      void this.importProfileFile(file);
    }
    input.value = "";
  };

  private handleImportDragEnter = (event: DragEvent): void => {
    event.preventDefault();
    this.importDragActive = true;
  };

  private handleImportDragOver = (event: DragEvent): void => {
    event.preventDefault();
    this.importDragActive = true;
  };

  private handleImportDragLeave = (event: DragEvent): void => {
    event.preventDefault();
    const nextTarget = event.relatedTarget as Node | null;
    if (!nextTarget || !this.renderRoot.contains(nextTarget)) {
      this.importDragActive = false;
    }
  };

  private handleImportDrop = (event: DragEvent): void => {
    event.preventDefault();
    this.importDragActive = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      void this.importProfileFile(file);
    }
  };

  private async importProfileFile(file: File): Promise<void> {
    this.importError = "";
    this.importInProgress = true;

    try {
      importProfileFromFileContent(await file.text());
      this.mode = "profiles";
      this.resetImportState();
      this.dispatchEvent(new CustomEvent("profile-switched", { bubbles: true, composed: true }));
    } catch {
      this.importError = "This file could not be imported. Use a Heroic Adventures profile export JSON file.";
    } finally {
      this.importInProgress = false;
    }
  }

  private resetImportState(): void {
    this.importError = "";
    this.importInProgress = false;
    this.importDragActive = false;
  }

  private handleOverlayClick(): void {
    if (this.showExisting && this.mode === "import") {
      this.handleBackToProfiles();
      return;
    }
    if (this.showExisting) {
      this.handleCancel();
    }
  }
}
