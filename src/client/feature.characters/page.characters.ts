import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { globalStyles } from "../styles.global.js";
import { PROFILE_CHANGED_EVENT } from "../../shared/service.profile.js";
import { Character } from "../../shared/type.character.js";
import { CHARACTERS_CHANGED_EVENT, getCharacters, upsertCharacter } from "../../shared/service.characters.js";
import "./component.character-create-form.js";
import "./component.character-card.js";

@customElement("page-characters")
export class PageCharacters extends LitElement {
  static override styles = [
    globalStyles,
    css`
      .hero {
        display: grid;
        gap: var(--size-large);
        margin-bottom: var(--size-large);
        padding: clamp(20px, 4vw, 32px);
        background:
          radial-gradient(circle at top right, rgba(201, 168, 76, 0.18), transparent 35%),
          linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(201, 168, 76, 0.03));
        border: var(--border-normal);
        border-radius: var(--border-radius-large);
      }

      .hero-copy {
        max-width: 68ch;
      }

      .hero-copy p {
        margin: 0;
        color: var(--color-primary-text-muted);
      }

      .hero-stats {
        display: flex;
        gap: var(--size-small);
        flex-wrap: wrap;
      }

      .hero-stat {
        padding: 10px 12px;
        border-radius: 999px;
        border: var(--border-normal);
        background: rgba(255, 255, 255, 0.02);
        font-size: var(--font-small);
        color: var(--color-primary-text-muted);
      }

      .layout {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--size-large);
        align-items: start;
      }

      .panel {
        display: grid;
        gap: var(--size-large);
        padding: var(--size-large);
        background: var(--color-primary-surface-raised);
        border: var(--border-normal);
        border-radius: var(--border-radius-medium);
      }

      .panel-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: var(--size-medium);
        flex-wrap: wrap;
      }

      .panel-header p {
        margin: 0;
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
      }

      .characters-list {
        display: grid;
        gap: var(--size-medium);
      }

      .empty {
        padding: var(--size-large);
        border: var(--border-normal);
        border-radius: var(--border-radius-medium);
        color: var(--color-primary-text-muted);
        text-align: center;
      }
    `,
  ];

  @state() private characters: Character[] = [];

  private readonly syncCharacters = (): void => {
    this.characters = getCharacters();
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncCharacters();
    window.addEventListener(CHARACTERS_CHANGED_EVENT, this.syncCharacters);
    window.addEventListener(PROFILE_CHANGED_EVENT, this.syncCharacters);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(CHARACTERS_CHANGED_EVENT, this.syncCharacters);
    window.removeEventListener(PROFILE_CHANGED_EVENT, this.syncCharacters);
  }

  override render(): TemplateResult {
    return html`
      <main>
        <section class="hero">
          <div class="hero-copy">
            <h1>Character Builder</h1>
            <p>
              Build characters from live game content, jump straight into the source pages behind every pick, and keep
              your roster ready for fast table reference.
            </p>
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              ${this.characters.length} saved ${this.characters.length === 1 ? "character" : "characters"}
            </div>
            <div class="hero-stat">Content-linked selections</div>
            <div class="hero-stat">Profile-scoped local storage</div>
          </div>
        </section>

        <div class="layout">
          <section class="panel">
            <div class="panel-header">
              <div>
                <h2 id="create-character">Create New Character</h2>
                <p>
                  Use the published races, classes, backgrounds, flaws, features, spells, feats, expertise, and items
                  already available in the compendium.
                </p>
              </div>
            </div>
            <character-create-form
              id="create-character-form"
              @character-created=${this.handleCharacterCreated}></character-create-form>
          </section>

          <section class="panel">
            <div class="panel-header">
              <div>
                <h2>Roster</h2>
                <p>Every saved character updates when you add compatible entries from their source pages.</p>
              </div>
            </div>

            ${this.characters.length === 0
              ? html`
                  <div class="empty">
                    No characters yet. Build one on the left, then start adding features, spells, and gear from entry
                    pages.
                  </div>
                `
              : html`
                  <div class="characters-list">
                    ${this.characters.map(
                      (character) => html`
                        <character-card .character=${character}></character-card>
                      `,
                    )}
                  </div>
                `}
          </section>
        </div>
      </main>
    `;
  }

  private handleCharacterCreated(event: CustomEvent<Character>): void {
    upsertCharacter(event.detail);
  }
}
