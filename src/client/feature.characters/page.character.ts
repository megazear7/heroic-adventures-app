import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { globalStyles } from "../styles.global.js";
import { leftArrowIcon } from "../icons.js";
import { Character, CharacterSchema } from "../../shared/type.character.js";
import {
  CHARACTERS_CHANGED_EVENT,
  deleteCharacter,
  getCharacters,
  upsertCharacter,
} from "../../shared/service.characters.js";
import { PROFILE_CHANGED_EVENT } from "../../shared/service.profile.js";
import { parseRouteParams } from "../../shared/util.route-params.js";
import "../component.toast.js";
import "./component.character-card.js";
import type { HeroicToastAction } from "../component.toast.js";

type ImportedCharacterState = {
  importedCharacterId: string;
  duplicateNameCharacterIds: string[];
};

function normalizeCharacterName(name: string): string {
  return name.trim().toLowerCase();
}

@customElement("heroic-character-page")
export class CharacterPage extends LitElement {
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
        margin-bottom: var(--size-medium);
      }

    `,
  ];

  @state() private character: Character | null = null;
  @state() private toastMessage = "";
  @state() private toastActions: HeroicToastAction[] = [];
  @state() private importedCharacterState: ImportedCharacterState | null = null;

  private readonly syncCharacter = (): void => {
    const id = parseRouteParams("/character/:characterId", window.location.pathname).characterId;
    this.character = getCharacters().find((character) => character.id === id) ?? null;
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.loadSharedCharacterFromUrl();
    this.syncCharacter();
    window.addEventListener(CHARACTERS_CHANGED_EVENT, this.syncCharacter);
    window.addEventListener(PROFILE_CHANGED_EVENT, this.syncCharacter);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(CHARACTERS_CHANGED_EVENT, this.syncCharacter);
    window.removeEventListener(PROFILE_CHANGED_EVENT, this.syncCharacter);
  }

  override render(): TemplateResult {
    return html`
      <main>
        <a href="/characters" class="back-link">${leftArrowIcon} Characters</a>
        ${this.character
          ? html`
              <character-card .character=${this.character}></character-card>
            `
          : html`
              <div class="muted">Character not found.</div>
            `}
        <heroic-toast
          .message=${this.toastMessage}
          .actions=${this.toastActions}
          @load-character=${this.handleLoadCharacter}
          @dismiss-character=${this.handleDismissCharacter}
          @replace-current-character=${this.handleReplaceCurrentCharacter}
          @load-duplicate-character=${this.handleLoadDuplicateCharacter}></heroic-toast>
      </main>
    `;
  }

  private loadSharedCharacterFromUrl(): void {
    const loadCharacterParam = new URL(window.location.href).searchParams.get("loadCharacter");
    if (!loadCharacterParam) {
      return;
    }

    let rawCharacter: unknown;
    try {
      rawCharacter = JSON.parse(loadCharacterParam);
    } catch {
      return;
    }

    const parsedCharacter = CharacterSchema.safeParse(rawCharacter);
    if (!parsedCharacter.success) {
      return;
    }

    const existingCharacters = getCharacters();
    const existingCharacterWithSameId = existingCharacters.find((character) => character.id === parsedCharacter.data.id);
    const importedCharacter = existingCharacterWithSameId
      ? {
          ...parsedCharacter.data,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      : parsedCharacter.data;

    const duplicateNameCharacterIds = existingCharacters
      .filter(
        (character) =>
          normalizeCharacterName(character.name) === normalizeCharacterName(importedCharacter.name) &&
          character.id !== importedCharacter.id,
      )
      .map((character) => character.id);

    if (importedCharacter.id !== parsedCharacter.data.id) {
      const url = new URL(window.location.href);
      url.pathname = `/character/${importedCharacter.id}`;
      window.history.replaceState({}, "", url.pathname + url.search);
    }

    upsertCharacter(importedCharacter);
    this.importedCharacterState = {
      importedCharacterId: importedCharacter.id,
      duplicateNameCharacterIds,
    };
    this.showImportToast(importedCharacter.name, duplicateNameCharacterIds.length > 0);
  }

  private showImportToast(characterName: string, hasConflict: boolean): void {
    this.toastMessage = `${characterName} was loaded from a shared character URL.`;
    this.toastActions = hasConflict
      ? [
          { label: "Replace Current Character", eventName: "replace-current-character" },
          { label: "Load Duplicate Character", eventName: "load-duplicate-character" },
          { label: "Dismiss Character", eventName: "dismiss-character" },
        ]
      : [
          { label: "Load Character", eventName: "load-character" },
          { label: "Dismiss Character", eventName: "dismiss-character" },
        ];
  }

  private clearToast(): void {
    this.toastMessage = "";
    this.toastActions = [];
  }

  private navigateToCharacters(): void {
    window.history.pushState({}, "", "/characters");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  private handleLoadCharacter = (): void => {
    this.importedCharacterState = null;
    this.clearToast();
  };

  private handleLoadDuplicateCharacter = (): void => {
    this.importedCharacterState = null;
    this.clearToast();
  };

  private handleDismissCharacter = (): void => {
    if (this.importedCharacterState) {
      deleteCharacter(this.importedCharacterState.importedCharacterId);
      this.importedCharacterState = null;
    }
    this.clearToast();
    this.navigateToCharacters();
  };

  private handleReplaceCurrentCharacter = (): void => {
    if (this.importedCharacterState) {
      this.importedCharacterState.duplicateNameCharacterIds.forEach((characterId) => deleteCharacter(characterId));
      this.importedCharacterState = null;
    }
    this.clearToast();
  };
}
