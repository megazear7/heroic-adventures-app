import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Character } from '../../shared/type.character';
import './component.character-create-form';
import './component.character-card';

@customElement('page-characters')
export class PageCharacters extends LitElement {
  static override styles = css`
    :host {
      display: block;
      padding: 1rem;
      min-height: 100vh;
      background: var(--ha-bg, #f7f7fa);
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
    const raw = localStorage.getItem('ha-characters');
    this.characters = raw ? JSON.parse(raw) : [];
  }

  private saveCharacters() {
    localStorage.setItem('ha-characters', JSON.stringify(this.characters));
  }

  private handleCharacterCreated(e: CustomEvent) {
    this.characters = [e.detail, ...this.characters];
    this.saveCharacters();
  }

  override render() {
    return html`
      <h1>Create Character</h1>
      <character-create-form @character-created=${this.handleCharacterCreated}></character-create-form>
      <div class="characters-list">
        ${this.characters.length === 0 ? html`<p>No characters yet.</p>` : this.characters.map(c => html`<character-card .character=${c}></character-card>`) }
      </div>
    `;
  }
}
