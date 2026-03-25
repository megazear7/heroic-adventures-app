import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { CharacterSchema, Character } from '../../shared/type.character';


@customElement('character-create-form')
export class CharacterCreateForm extends LitElement {
  static override styles = css`
    :host {
      display: block;
      max-width: 480px;
      margin: 0 auto;
      padding: 1rem;
      background: var(--ha-surface, #fff);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    label {
      font-weight: 500;
      margin-bottom: 0.25rem;
    }
    input, select, textarea {
      font-size: 1rem;
      padding: 0.5rem;
      border-radius: 6px;
      border: 1px solid #ccc;
    }
    .row {
      display: flex;
      gap: 0.5rem;
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

  @state() private form: Partial<Character> = {};
  @state() private error: string | null = null;

  // TODO: Replace with real options from content
  private races = ['Human', 'Elf', 'Dwarf', 'Orc'];
  private classes = ['Fighter', 'Wizard', 'Rogue', 'Cleric'];
  private backgrounds = ['Noble', 'Outlander', 'Scholar', 'Soldier'];
  private flaws = ['Greedy', 'Cowardly', 'Arrogant', 'Impulsive'];
  private spells = ['Fireball', 'Heal', 'Invisibility', 'Lightning Bolt'];
  private features = ['Darkvision', 'Brave', 'Lucky', 'Spellcasting'];
  private feats = ['Sharpshooter', 'Tough', 'Alert', 'Resilient'];
  private expertise = ['Stealth', 'Arcana', 'Athletics', 'Persuasion'];

  private handleInput(e: Event) {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const name = target.name as keyof Character;
    if (target.type === 'checkbox' && Array.isArray(this.form[name])) {
      const arr = [...(this.form[name] as string[] ?? [])];
      if (target.checked) arr.push(target.value);
      else arr.splice(arr.indexOf(target.value), 1);
      this.form = { ...this.form, [name]: arr };
    } else {
      this.form = { ...this.form, [name]: target.value };
    }
  }

  private handleSubmit(e: Event) {
    e.preventDefault();
    this.error = null;
    const now = Date.now();
    const candidate = {
      ...this.form,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      spells: this.form.spells ?? [],
      features: this.form.features ?? [],
      feats: this.form.feats ?? [],
      expertise: this.form.expertise ?? [],
    };
    const result = CharacterSchema.safeParse(candidate);
    if (!result.success) {
      this.error = 'Please fill all required fields.';
      return;
    }
    this.dispatchEvent(new CustomEvent('character-created', {
      detail: result.data,
      bubbles: true,
      composed: true,
    }));
    this.form = {};
  }

  override render() {
    return html`
      <form @submit=${this.handleSubmit} autocomplete="off">
        <label>
          Name
          <input name="name" .value=${this.form.name ?? ''} @input=${this.handleInput} required />
        </label>
        <label>
          Race
          <select name="race" @change=${this.handleInput} required>
            <option value="">Select...</option>
            ${this.races.map(r => html`<option ?selected=${this.form.race===r}>${r}</option>`)}
          </select>
        </label>
        <label>
          Class
          <select name="class" @change=${this.handleInput} required>
            <option value="">Select...</option>
            ${this.classes.map(c => html`<option ?selected=${this.form.class===c}>${c}</option>`)}
          </select>
        </label>
        <label>
          Background
          <select name="background" @change=${this.handleInput} required>
            <option value="">Select...</option>
            ${this.backgrounds.map(b => html`<option ?selected=${this.form.background===b}>${b}</option>`)}
          </select>
        </label>
        <label>
          Flaw
          <select name="flaw" @change=${this.handleInput} required>
            <option value="">Select...</option>
            ${this.flaws.map(f => html`<option ?selected=${this.form.flaw===f}>${f}</option>`)}
          </select>
        </label>
        <fieldset>
          <legend>Spells</legend>
          ${this.spells.map(s => html`
            <label><input type="checkbox" name="spells" value="${s}" @change=${this.handleInput} .checked=${(this.form.spells ?? []).includes(s)} /> ${s}</label>
          `)}
        </fieldset>
        <fieldset>
          <legend>Features</legend>
          ${this.features.map(f => html`
            <label><input type="checkbox" name="features" value="${f}" @change=${this.handleInput} .checked=${(this.form.features ?? []).includes(f)} /> ${f}</label>
          `)}
        </fieldset>
        <fieldset>
          <legend>Feats</legend>
          ${this.feats.map(f => html`
            <label><input type="checkbox" name="feats" value="${f}" @change=${this.handleInput} .checked=${(this.form.feats ?? []).includes(f)} /> ${f}</label>
          `)}
        </fieldset>
        <fieldset>
          <legend>Expertise</legend>
          ${this.expertise.map(e => html`
            <label><input type="checkbox" name="expertise" value="${e}" @change=${this.handleInput} .checked=${(this.form.expertise ?? []).includes(e)} /> ${e}</label>
          `)}
        </fieldset>
        ${this.error ? html`<div style="color: red;">${this.error}</div>` : ''}
        <button type="submit">Create Character</button>
      </form>
    `;
  }
}
