import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { globalStyles } from "../styles.global.js";
import { leftArrowIcon } from "../icons.js";
import { Character } from "../../shared/type.character.js";
import { CHARACTERS_CHANGED_EVENT, getCharacters } from "../../shared/service.characters.js";
import { PROFILE_CHANGED_EVENT } from "../../shared/service.profile.js";
import { parseRouteParams } from "../../shared/util.route-params.js";
import "./component.character-card.js";

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

  private readonly syncCharacter = (): void => {
    const id = parseRouteParams("/character/:characterId", window.location.pathname).characterId;
    this.character = getCharacters().find((character) => character.id === id) ?? null;
  };

  override connectedCallback(): void {
    super.connectedCallback();
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
      </main>
    `;
  }
}
