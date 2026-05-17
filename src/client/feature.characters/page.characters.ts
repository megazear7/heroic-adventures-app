import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { globalStyles } from "../styles.global.js";
import { PROFILE_CHANGED_EVENT } from "../../shared/service.profile.js";
import { Character } from "../../shared/type.character.js";
import { CHARACTERS_CHANGED_EVENT, getCharacters } from "../../shared/service.characters.js";
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

      .roster {
        display: grid;
        gap: var(--size-large);
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
  @state() private showArchived = false;

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
    const activeCharacters = this.characters.filter((character) => !character.archived);
    const archivedCharacters = this.characters.filter((character) => character.archived);
    const visibleCharacters = this.showArchived ? this.characters : activeCharacters;

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
              ${activeCharacters.length} active ${activeCharacters.length === 1 ? "character" : "characters"}
            </div>
            ${archivedCharacters.length > 0
              ? html`
                  <div class="hero-stat">${archivedCharacters.length} archived</div>
                `
              : ""}
            <div class="hero-stat">Content-linked selections</div>
            <div class="hero-stat">Profile-scoped local storage</div>
            <a class="btn btn-primary" href="/character/create">Create Character</a>
          </div>
        </section>

        <div class="layout">
          <section class="roster">
            <div class="panel-header">
              <div>
                <h2>Roster</h2>
                <p>Every saved character updates when you add compatible entries from their source pages.</p>
              </div>
              ${archivedCharacters.length > 0
                ? html`
                    <button class="btn" type="button" @click=${this.toggleArchived}>
                      ${this.showArchived ? "Hide archived" : `Show archived (${archivedCharacters.length})`}
                    </button>
                  `
                : ""}
            </div>

            ${visibleCharacters.length === 0
              ? html`
                  <div class="empty">
                    ${this.characters.length === 0
                      ? "No characters yet. Build one on the left, then start adding features, spells, and gear from entry pages."
                      : "No active characters. Show archived to restore one."}
                  </div>
                `
              : html`
                  <div class="characters-list">
                    ${visibleCharacters.map(
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

  private toggleArchived = (): void => {
    this.showArchived = !this.showArchived;
  };
}
