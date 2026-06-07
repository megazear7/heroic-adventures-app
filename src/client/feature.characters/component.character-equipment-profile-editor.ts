import { css, html, LitElement, nothing, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { globalStyles } from "../styles.global.js";
import { SearchIndexedEntry } from "../service.search.js";
import {
  CharacterContentLink,
  CharacterEquipmentProfile,
  EQUIPMENT_PROFILE_DAMAGE_DIE_SIZES,
  EquipmentProfileDamageDieSize,
  createDefaultEquipmentProfile,
  formatEquipmentProfileDamage,
} from "../../shared/type.character.js";
import "./component.character-entry-picker.js";

export type EquipmentProfilesChangeDetail = {
  profiles: CharacterEquipmentProfile[];
  activeProfileId: string;
};

type EquipmentProfileLinkKey = "primary" | "secondary" | "armor";
type EquipmentProfileStatKey = "skill" | "aim" | "block" | "initiative" | "agility" | "tactics" | "toughness";
type EquipmentProfileDamageNumberKey = "diceCount" | "bonus";

const PROFILE_STAT_FIELDS: Array<{ key: EquipmentProfileStatKey; label: string; min?: number }> = [
  { key: "skill", label: "Skill" },
  { key: "aim", label: "Aim" },
  { key: "block", label: "Block", min: 0 },
  { key: "initiative", label: "Initiative", min: 0 },
  { key: "agility", label: "Agility" },
  { key: "tactics", label: "Tactics" },
  { key: "toughness", label: "Toughness", min: 0 },
];

@customElement("character-equipment-profile-editor")
export class CharacterEquipmentProfileEditor extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        display: block;
      }

      .section {
        display: grid;
        gap: var(--size-large);
      }

      .section-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: var(--size-medium);
        flex-wrap: wrap;
      }

      .section-header p {
        margin: 0;
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
        max-width: 72ch;
      }

      .profiles {
        display: grid;
        gap: var(--size-large);
      }

      .profile-card {
        display: grid;
        gap: var(--size-large);
        padding: var(--size-large);
        border: var(--border-normal);
        border-radius: var(--border-radius-medium);
        background: rgba(255, 255, 255, 0.02);
      }

      .profile-card.active {
        border-color: rgba(201, 168, 76, 0.45);
        background: rgba(201, 168, 76, 0.08);
      }

      .profile-header {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: var(--size-medium);
        flex-wrap: wrap;
      }

      .profile-heading {
        display: grid;
        gap: 4px;
      }

      .profile-heading h3 {
        margin: 0;
      }

      .profile-heading p {
        margin: 0;
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
      }

      .profile-actions {
        display: flex;
        gap: var(--size-small);
        flex-wrap: wrap;
      }

      .picker-grid,
      .stats-grid,
      .damage-grid {
        display: grid;
        gap: var(--size-medium);
      }

      .picker-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .stats-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .damage-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .field {
        display: grid;
        gap: var(--size-small);
      }

      .field label,
      .damage-label {
        font-size: var(--font-small);
        font-weight: 600;
      }

      .field input,
      .field select {
        width: 100%;
        box-sizing: border-box;
        padding: 12px 14px;
        border-radius: var(--border-radius-small);
        border: var(--border-normal);
        background: var(--color-primary-surface-raised);
        color: var(--color-primary-text);
        font-size: var(--font-medium);
        font-family: var(--font-family);
      }

      .checkbox-field {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 48px;
        padding: 12px 14px;
        border-radius: var(--border-radius-small);
        border: var(--border-normal);
        background: var(--color-primary-surface-raised);
        box-sizing: border-box;
      }

      .checkbox-field input {
        width: auto;
        margin: 0;
      }

      .damage-summary {
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
      }

      @media (max-width: 900px) {
        .picker-grid,
        .damage-grid {
          grid-template-columns: 1fr;
        }

        .stats-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 600px) {
        .stats-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ];

  @property({ attribute: false }) profiles: CharacterEquipmentProfile[] = [];
  @property({ type: String }) activeProfileId = "";
  @property({ attribute: false }) catalog: SearchIndexedEntry[] = [];
  @property({ type: String }) override title = "Equipment Profiles";
  @property({ type: String }) description =
    "Choose primary and secondary weapons, armor, and the combat stats for each profile. One profile must stay active.";

  override render(): TemplateResult {
    return html`
      <section class="section">
        <div class="section-header">
          <div>
            <h2>${this.title}</h2>
            <p>${this.description}</p>
          </div>
          <button class="btn" type="button" @click=${this.addProfile}>Add Profile</button>
        </div>

        <div class="profiles">
          ${this.profiles.map((profile, index) => this.renderProfile(profile, index))}
        </div>
      </section>
    `;
  }

  private renderProfile(profile: CharacterEquipmentProfile, index: number): TemplateResult {
    const isActive = profile.id === this.activeProfileId;
    return html`
      <article class="profile-card ${isActive ? "active" : ""}">
        <div class="profile-header">
          <div class="profile-heading">
            <h3>Profile ${index + 1}</h3>
            <p>
              ${isActive
                ? "Active in encounters and stat summaries."
                : "Available to switch to later on the character page."}
            </p>
          </div>

          <div class="profile-actions">
            <button class="btn" type="button" ?disabled=${isActive} @click=${() => this.setActiveProfile(profile.id)}>
              ${isActive ? "Active" : "Set Active"}
            </button>
            <button
              class="btn"
              type="button"
              ?disabled=${this.profiles.length <= 1}
              @click=${() => this.removeProfile(profile.id)}>
              Remove
            </button>
          </div>
        </div>

        <div class="picker-grid">
          ${this.renderEntryPicker(profile, "primary", "Primary Weapon", "Choose from item > weapon")}
          ${this.renderEntryPicker(profile, "secondary", "Secondary Weapon", "Choose from item > weapon")}
          ${this.renderEntryPicker(profile, "armor", "Armor", "Choose from item > armor")}
        </div>

        <div class="stats-grid">
          ${PROFILE_STAT_FIELDS.map((field) => this.renderStatField(profile, field.key, field.label, field.min))}
        </div>

        <div class="field">
          <span class="damage-label">Damage</span>
          <div class="damage-grid">
            <div class="field">
              <label for=${`damage-count-${profile.id}`}>Dice Count</label>
              <input
                id=${`damage-count-${profile.id}`}
                type="number"
                min="1"
                .value=${String(profile.damage.diceCount)}
                @input=${(event: Event) => this.handleDamageNumberInput(profile.id, "diceCount", event)} />
            </div>

            <div class="field">
              <label for=${`damage-size-${profile.id}`}>Die Size</label>
              <select
                id=${`damage-size-${profile.id}`}
                .value=${profile.damage.diceSize}
                @change=${(event: Event) => this.handleDamageSizeInput(profile.id, event)}>
                ${EQUIPMENT_PROFILE_DAMAGE_DIE_SIZES.map(
                  (size) => html`
                    <option value=${size}>${size}</option>
                  `,
                )}
              </select>
            </div>

            <div class="field">
              <label for=${`damage-bonus-${profile.id}`}>Damage Bonus</label>
              <input
                id=${`damage-bonus-${profile.id}`}
                type="number"
                .value=${String(profile.damage.bonus)}
                @input=${(event: Event) => this.handleDamageNumberInput(profile.id, "bonus", event)} />
            </div>

            <label class="field" for=${`damage-lowest-${profile.id}`}>
              <span>Remove Lowest</span>
              <span class="checkbox-field">
                <input
                  id=${`damage-lowest-${profile.id}`}
                  type="checkbox"
                  .checked=${profile.damage.removeLowest}
                  @change=${(event: Event) => this.handleRemoveLowestInput(profile.id, event)} />
                <span>${profile.damage.removeLowest ? "Lowest die removed" : "Keep all dice"}</span>
              </span>
            </label>
          </div>
          <div class="damage-summary">Current damage: ${formatEquipmentProfileDamage(profile.damage)}</div>
        </div>
      </article>
    `;
  }

  private renderEntryPicker(
    profile: CharacterEquipmentProfile,
    key: EquipmentProfileLinkKey,
    label: string,
    helper: string,
  ): TemplateResult {
    const entries = key === "armor" ? this.armorEntries : this.weaponEntries;
    return html`
      <character-entry-picker
        .label=${label}
        .helper=${helper}
        .entries=${entries}
        .selected=${this.singleSelection(profile[key])}
        @selection-change=${(event: CustomEvent<{ value: CharacterContentLink[] }>) =>
          this.handleLinkSelection(profile.id, key, event)}></character-entry-picker>
    `;
  }

  private renderStatField(
    profile: CharacterEquipmentProfile,
    key: EquipmentProfileStatKey,
    label: string,
    min?: number,
  ): TemplateResult {
    return html`
      <div class="field">
        <label for=${`${key}-${profile.id}`}>${label}</label>
        <input
          id=${`${key}-${profile.id}`}
          type="number"
          min=${min === undefined ? nothing : String(min)}
          .value=${String(profile[key])}
          @input=${(event: Event) => this.handleStatInput(profile.id, key, event, min)} />
      </div>
    `;
  }

  private get sortedEntries(): SearchIndexedEntry[] {
    return [...this.catalog].sort((left, right) => left.order - right.order || left.title.localeCompare(right.title));
  }

  private get weaponEntries(): SearchIndexedEntry[] {
    return this.sortedEntries.filter((entry) => entry.categoryId === "items-weapon");
  }

  private get armorEntries(): SearchIndexedEntry[] {
    return this.sortedEntries.filter((entry) => entry.categoryId === "items-armor");
  }

  private singleSelection(value: CharacterContentLink | null | undefined): CharacterContentLink[] {
    return value ? [value] : [];
  }

  private setActiveProfile(profileId: string): void {
    this.emitChange(this.profiles, profileId);
  }

  private addProfile = (): void => {
    const profile = createDefaultEquipmentProfile();
    this.emitChange([...this.profiles, profile], this.activeProfileId || profile.id);
  };

  private removeProfile(profileId: string): void {
    if (this.profiles.length <= 1) {
      return;
    }

    const profiles = this.profiles.filter((profile) => profile.id !== profileId);
    const activeProfileId = this.activeProfileId === profileId ? profiles[0]?.id ?? "" : this.activeProfileId;
    this.emitChange(profiles, activeProfileId);
  }

  private handleLinkSelection(
    profileId: string,
    key: EquipmentProfileLinkKey,
    event: CustomEvent<{ value: CharacterContentLink[] }>,
  ): void {
    this.updateProfile(profileId, {
      [key]: event.detail.value[0] ?? null,
    });
  }

  private handleStatInput(profileId: string, key: EquipmentProfileStatKey, event: Event, min?: number): void {
    const rawValue = (event.target as HTMLInputElement).value;
    const parsed = parseInt(rawValue, 10);
    const fallback = min ?? 0;
    const value = Number.isNaN(parsed) ? fallback : min === undefined ? parsed : Math.max(min, parsed);
    this.updateProfile(profileId, { [key]: value });
  }

  private handleDamageNumberInput(profileId: string, key: EquipmentProfileDamageNumberKey, event: Event): void {
    const profile = this.profiles.find((item) => item.id === profileId);
    if (!profile) {
      return;
    }

    const rawValue = (event.target as HTMLInputElement).value;
    const parsed = parseInt(rawValue, 10);
    const value = Number.isNaN(parsed) ? (key === "diceCount" ? 1 : 0) : key === "diceCount" ? Math.max(1, parsed) : parsed;

    this.updateProfile(profileId, {
      damage: {
        ...profile.damage,
        [key]: value,
      },
    });
  }

  private handleDamageSizeInput(profileId: string, event: Event): void {
    const profile = this.profiles.find((item) => item.id === profileId);
    if (!profile) {
      return;
    }

    this.updateProfile(profileId, {
      damage: {
        ...profile.damage,
        diceSize: (event.target as HTMLSelectElement).value as EquipmentProfileDamageDieSize,
      },
    });
  }

  private handleRemoveLowestInput(profileId: string, event: Event): void {
    const profile = this.profiles.find((item) => item.id === profileId);
    if (!profile) {
      return;
    }

    this.updateProfile(profileId, {
      damage: {
        ...profile.damage,
        removeLowest: (event.target as HTMLInputElement).checked,
      },
    });
  }

  private updateProfile(profileId: string, changes: Partial<CharacterEquipmentProfile>): void {
    const profiles = this.profiles.map((profile) => {
      if (profile.id !== profileId) {
        return profile;
      }

      return {
        ...profile,
        ...changes,
        damage: {
          ...profile.damage,
          ...(changes.damage ?? {}),
        },
      };
    });

    this.emitChange(profiles, this.activeProfileId || profiles[0]?.id || "");
  }

  private emitChange(profiles: CharacterEquipmentProfile[], activeProfileId: string): void {
    this.dispatchEvent(
      new CustomEvent<EquipmentProfilesChangeDetail>("profiles-change", {
        detail: {
          profiles,
          activeProfileId: activeProfileId || profiles[0]?.id || "",
        },
        bubbles: true,
        composed: true,
      }),
    );
  }
}