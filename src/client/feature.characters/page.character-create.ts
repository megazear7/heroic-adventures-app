import { css, html, LitElement, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { globalStyles } from "../styles.global.js";
import { leftArrowIcon } from "../icons.js";
import { Character } from "../../shared/type.character.js";
import { upsertCharacter } from "../../shared/service.characters.js";
import "./component.character-create-form.js";

@customElement("heroic-character-create-page")
export class CharacterCreatePage extends LitElement {
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

      .card {
        display: grid;
        gap: var(--size-medium);
      }
    `,
  ];

  override render(): TemplateResult {
    return html`
      <main>
        <a href="/characters" class="back-link">${leftArrowIcon} Characters</a>
        <section class="card">
          <h1>Create Character</h1>
          <character-create-form @character-created=${this.handleCharacterCreated}></character-create-form>
        </section>
      </main>
    `;
  }

  private handleCharacterCreated(event: CustomEvent<Character>): void {
    const character = upsertCharacter(event.detail);
    this.dispatchEvent(
      new CustomEvent("NavigationEvent", {
        detail: { path: `/character/${character.id}` },
        bubbles: true,
        composed: true,
      }),
    );
  }
}
