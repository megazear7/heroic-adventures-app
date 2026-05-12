import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { state } from 'lit/decorators.js';
import { Character } from '../../shared/type.character';

@customElement('character-card')
export class CharacterCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
      max-width: 560px;
      margin: 1rem auto;
      padding: 1rem 1rem 0.75rem;
      background: var(--color-primary-surface-raised, #16162a);
      color: var(--color-primary-text, #e2e0d6);
      border: 1px solid rgba(201, 168, 76, 0.2);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.3rem;
      color: var(--color-1, #c9a84c);
    }
    .summary {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }
    .pill {
      border: 1px solid rgba(201, 168, 76, 0.3);
      border-radius: 999px;
      padding: 0.15rem 0.5rem;
      font-size: 0.8rem;
      color: var(--color-primary-text-muted, #8a8780);
    }
    h3 {
      margin: 0.5rem 0 0.25rem;
      font-size: 0.9rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--color-primary-text-muted, #8a8780);
    }
    ul {
      margin: 0.25rem 0 0.5rem 1.5rem;
      padding: 0;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 0.75rem;
    }
    .actions button {
      border: 1px solid rgba(201, 168, 76, 0.3);
      background: transparent;
      color: var(--color-primary-text, #e2e0d6);
      border-radius: 6px;
      padding: 0.35rem 0.6rem;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .feedback {
      margin-top: 0.4rem;
      color: var(--color-primary-text-muted, #8a8780);
      font-size: 0.8rem;
    }
    @media (max-width: 600px) {
      :host {
        padding: 0.75rem;
        max-width: 100vw;
        border-radius: 8px;
      }
    }
  `;

  @property({ type: Object }) character!: Character;
  @state() private feedback = '';

  private async copyCharacter() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(this.character, null, 2));
      this.feedback = 'Character copied to clipboard.';
    } catch {
      this.feedback = 'Clipboard unavailable.';
    }
  }

  private shareCharacter() {
    const text = `${this.character.name} • ${this.character.race} ${this.character.class}`;
    const share = (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }).share;
    if (!share) {
      this.copyCharacter();
      return;
    }
    share({
      title: `Heroic Adventures Character: ${this.character.name}`,
      text,
    }).catch(() => {
      this.feedback = 'Share canceled.';
    });
  }

  private exportCharacter() {
    const blob = new Blob([JSON.stringify(this.character, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.character.name.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || 'character'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.feedback = 'Character exported.';
  }

  override render() {
    if (!this.character) return html``;
    const c = this.character;
    return html`
      <h2>${c.name}</h2>
      <div class="summary">
        <span class="pill">${c.race}</span>
        <span class="pill">${c.class}</span>
        <span class="pill">${c.background}</span>
        <span class="pill">${c.flaw}</span>
      </div>
      <div class="sheet">
        <h3>Spells</h3>
        <ul>${c.spells.map(s => html`<li>${s}</li>`)}</ul>
        <h3>Features</h3>
        <ul>${c.features.map(f => html`<li>${f}</li>`)}</ul>
        <h3>Feats</h3>
        <ul>${c.feats.map(f => html`<li>${f}</li>`)}</ul>
        <h3>Expertise</h3>
        <ul>${c.expertise.map(e => html`<li>${e}</li>`)}</ul>
      </div>
      <div class="actions">
        <button type="button" @click=${this.shareCharacter}>Share</button>
        <button type="button" @click=${this.exportCharacter}>Export JSON</button>
        <button type="button" @click=${this.copyCharacter}>Copy</button>
      </div>
      ${this.feedback ? html`<div class="feedback">${this.feedback}</div>` : ''}
    `;
  }
}
