import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Character, CharacterSchema } from '../../shared/type.character';
import './component.character-create-form';
import './component.character-card';

const STORAGE_KEY = 'ha-characters';

@customElement('page-characters')
export class PageCharacters extends LitElement {
  static override styles = css`
    :host {
      display: block;
      padding: 1rem;
      min-height: 100vh;
      background: var(--ha-bg, #f7f7fa);
    }
    h1 {
      margin-bottom: 0.25rem;
    }
    .subtitle {
      margin: 0 0 1rem;
      color: #666;
      font-size: 0.9rem;
    }
    .builder-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 0.5rem;
    }
    .builder-header h2 {
      margin: 0;
      font-size: 1rem;
    }
    .create-new-link {
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      color: #1a1a2e;
      border: 1px solid #1a1a2e;
      border-radius: 6px;
      padding: 0.3rem 0.65rem;
      background: #fff;
    }
    .create-new-link:hover {
      background: #f0f0f5;
    }
    .characters-list {
      margin-top: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    @media (max-width: 600px) {
      :host {
        padding: 0.25rem;
      }
    }
  `;

  @state() private characters: Character[] = [];

  override connectedCallback() {
    super.connectedCallback();
    this.loadCharacters();
  }

  private loadCharacters() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      this.characters = Array.isArray(parsed) ? parsed.filter((c) => CharacterSchema.safeParse(c).success) : [];
    } catch {
      this.characters = [];
    }
  }

  private saveCharacters() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.characters));
  }

  private handleCharacterCreated(e: CustomEvent) {
    this.characters = [e.detail, ...this.characters];
    this.saveCharacters();
  }

  override render() {
    return html`
      <h1>Character Builder</h1>
      <p class="subtitle">Build in steps, auto-save drafts locally, and keep read-only sheets handy for mobile play.</p>
      <div class="builder-header">
        <h2 id="create-character">Create New Character</h2>
        <a class="create-new-link" href="#create-character-form">Start Building</a>
      </div>
      <character-create-form id="create-character-form" @character-created=${this.handleCharacterCreated}></character-create-form>
      <div class="characters-list">
        ${this.characters.length === 0 ? html`<p>No characters yet.</p>` : this.characters.map(c => html`<character-card .character=${c}></character-card>`)}
      </div>
    `;
  }
}
