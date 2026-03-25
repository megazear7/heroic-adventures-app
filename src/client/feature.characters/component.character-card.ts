import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Character } from '../../shared/type.character';

@customElement('character-card')
export class CharacterCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
      max-width: 480px;
      margin: 1rem auto;
      padding: 1rem;
      background: var(--ha-surface, #fff);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
    }
    .row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .label {
      font-weight: 500;
      color: #555;
      margin-right: 0.5rem;
    }
    ul {
      margin: 0.25rem 0 0.5rem 1.5rem;
      padding: 0;
    }
    @media (max-width: 600px) {
      :host {
        padding: 0.5rem;
        max-width: 100vw;
        border-radius: 0;
        box-shadow: none;
      }
    }
  `;

  @property({ type: Object }) character!: Character;

  override render() {
    if (!this.character) return html``;
    const c = this.character;
    return html`
      <h2>${c.name}</h2>
      <div class="row">
        <span class="label">Race:</span> ${c.race}
        <span class="label">Class:</span> ${c.class}
        <span class="label">Background:</span> ${c.background}
        <span class="label">Flaw:</span> ${c.flaw}
      </div>
      <div>
        <span class="label">Spells:</span>
        <ul>${c.spells.map(s => html`<li>${s}</li>`)}</ul>
      </div>
      <div>
        <span class="label">Features:</span>
        <ul>${c.features.map(f => html`<li>${f}</li>`)}</ul>
      </div>
      <div>
        <span class="label">Feats:</span>
        <ul>${c.feats.map(f => html`<li>${f}</li>`)}</ul>
      </div>
      <div>
        <span class="label">Expertise:</span>
        <ul>${c.expertise.map(e => html`<li>${e}</li>`)}</ul>
      </div>
    `;
  }
}
