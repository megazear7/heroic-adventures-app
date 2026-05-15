import { css, html, LitElement, nothing, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { globalStyles } from "../styles.global.js";
import {
  addEntryToCharacter,
  CHARACTERS_CHANGED_EVENT,
  getCharacters,
  getCharacterSelectionKeyForCategory,
} from "../../shared/service.characters.js";
import { Character, CharacterContentLink, CharacterSelectionKey } from "../../shared/type.character.js";
import { PROFILE_CHANGED_EVENT } from "../../shared/service.profile.js";

const SLOT_LABELS: Record<CharacterSelectionKey, string> = {
  race: "Race",
  class: "Class",
  background: "Background",
  flaw: "Flaw",
  spells: "Spell List",
  features: "Features",
  feats: "Feats",
  expertise: "Expertise",
  gear: "Gear",
};

@customElement("character-entry-assigner")
export class CharacterEntryAssigner extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        display: block;
      }

      .assigner {
        margin-bottom: var(--size-large);
        padding: var(--size-large);
        background: linear-gradient(180deg, rgba(201, 168, 76, 0.08), rgba(201, 168, 76, 0.02));
        border: var(--border-normal);
        border-radius: var(--border-radius-medium);
      }

      .assigner-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: var(--size-medium);
        margin-bottom: var(--size-medium);
      }

      .assigner-copy {
        max-width: 60ch;
      }

      .assigner-copy p {
        margin: 0;
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
      }

      .character-list {
        display: grid;
        gap: var(--size-small);
      }

      .character-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: var(--size-medium);
        align-items: center;
        padding: var(--size-medium);
        border: var(--border-normal);
        border-radius: var(--border-radius-small);
        background: rgba(255, 255, 255, 0.02);
      }

      .character-name {
        font-size: var(--font-medium);
        font-weight: 600;
      }

      .character-meta {
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
      }

      .status {
        margin-top: 4px;
        font-size: var(--font-tiny);
        color: var(--color-primary-text-muted);
      }

      .cta {
        min-width: 110px;
      }

      .empty {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--size-medium);
        border: var(--border-normal);
        border-radius: var(--border-radius-small);
        padding: var(--size-medium);
        color: var(--color-primary-text-muted);
      }

      .feedback {
        margin-top: var(--size-small);
        font-size: var(--font-small);
        color: var(--color-primary-text-muted);
      }

      @media (max-width: 700px) {
        .character-row,
        .empty {
          grid-template-columns: 1fr;
        }
      }
    `,
  ];

  @property({ attribute: false }) entry: CharacterContentLink | null = null;

  @state() private characters: Character[] = [];
  @state() private feedback = "";

  private readonly handleCharactersChanged = (): void => {
    this.characters = getCharacters();
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.handleCharactersChanged();
    window.addEventListener(CHARACTERS_CHANGED_EVENT, this.handleCharactersChanged);
    window.addEventListener(PROFILE_CHANGED_EVENT, this.handleCharactersChanged);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(CHARACTERS_CHANGED_EVENT, this.handleCharactersChanged);
    window.removeEventListener(PROFILE_CHANGED_EVENT, this.handleCharactersChanged);
  }

  override render(): TemplateResult {
    if (!this.entry) {
      return html``;
    }

    const slot = getCharacterSelectionKeyForCategory(this.entry.categoryId);
    if (!slot) {
      return html``;
    }

    return html`
      <section class="assigner">
        <div class="assigner-header">
          <div class="assigner-copy">
            <h3>Add To Character</h3>
            <p>Add ${this.entry.title} to an existing character's ${SLOT_LABELS[slot]}.</p>
          </div>
        </div>

        ${this.characters.length === 0
          ? html`
              <div class="empty">
                <span>No saved characters yet.</span>
                <a class="btn btn-primary" href="/characters#create-character-form">Create Character</a>
              </div>
            `
          : html`
              <div class="character-list">
                ${this.characters.map((character) => this.renderCharacterRow(character, slot))}
              </div>
            `}
        ${this.feedback
          ? html`
              <div class="feedback">${this.feedback}</div>
            `
          : nothing}
      </section>
    `;
  }

  private renderCharacterRow(character: Character, slot: CharacterSelectionKey): TemplateResult {
    const state = this.getCharacterState(character, slot);

    return html`
      <div class="character-row">
        <div>
          <div class="character-name">${character.name}</div>
          <div class="character-meta">${character.race.title} • ${character.class.title}</div>
          ${state.message
            ? html`
                <div class="status">${state.message}</div>
              `
            : nothing}
        </div>
        <button
          class="btn cta"
          type="button"
          ?disabled=${state.disabled}
          @click=${() => this.handleAssign(character.id)}>
          ${state.cta}
        </button>
      </div>
    `;
  }

  private handleAssign(characterId: string): void {
    if (!this.entry) {
      return;
    }

    const updated = addEntryToCharacter(characterId, this.entry);
    if (!updated) {
      return;
    }

    this.feedback = `${this.entry.title} added to ${updated.name}.`;
  }

  private getCharacterState(
    character: Character,
    slot: CharacterSelectionKey,
  ): { cta: string; disabled: boolean; message?: string } {
    if (slot === "race" || slot === "class" || slot === "background" || slot === "flaw") {
      const current = character[slot];
      if (current.categoryId === this.entry?.categoryId && current.slug === this.entry.slug) {
        return { cta: "Selected", disabled: true, message: `Already set as ${SLOT_LABELS[slot].toLowerCase()}.` };
      }
      return { cta: `Replace ${SLOT_LABELS[slot]}`, disabled: false, message: `Currently ${current.title}.` };
    }

    const current = character[slot];
    const alreadyAdded = current.some(
      (item) => item.categoryId === this.entry?.categoryId && item.slug === this.entry.slug,
    );
    if (alreadyAdded) {
      return { cta: "Added", disabled: true, message: `Already in ${SLOT_LABELS[slot].toLowerCase()}.` };
    }
    return { cta: `Add To ${SLOT_LABELS[slot]}`, disabled: false };
  }
}
