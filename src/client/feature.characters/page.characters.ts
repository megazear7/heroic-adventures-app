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
      <character-create-form @character-created=${this.handleCharacterCreated}></character-create-form>
      <div class="characters-list">
        ${this.characters.length === 0 ? html`<p>No characters yet.</p>` : this.characters.map(c => html`<character-card .character=${c}></character-card>`)}
      </div>
    `;
  }
}
