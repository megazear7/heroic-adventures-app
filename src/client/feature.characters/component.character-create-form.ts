import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { CharacterSchema, Character } from '../../shared/type.character';

const DRAFT_STORAGE_KEY = 'ha-character-builder-draft';
const STEPS = ['Identity', 'Story', 'Build', 'Review'] as const;

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
    .tabs {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.5rem;
    }
    .tab {
      border: 1px solid #ccc;
      border-radius: 8px;
      background: #fff;
      font-size: 0.75rem;
      padding: 0.35rem;
    }
    .tab.active {
      border-color: #85703a;
      background: #f5efe2;
      font-weight: 600;
    }
    fieldset {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 0.5rem;
      margin: 0;
    }
    .option-list {
      display: grid;
      gap: 0.35rem;
      margin-top: 0.35rem;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .actions button {
      padding: 0.5rem 0.8rem;
      border-radius: 6px;
      border: 1px solid #ccc;
      background: #fff;
    }
    .actions button[type='submit'] {
      background: #1a1a2e;
      color: #fff;
      border-color: #1a1a2e;
    }
    .helper {
      color: #666;
      font-size: 0.85rem;
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
  @state() private step = 0;

  // TODO: Replace with real options from content
  private races = ['Human', 'Elf', 'Dwarf', 'Orc'];
  private classes = ['Fighter', 'Wizard', 'Rogue', 'Cleric'];
  private backgrounds = ['Noble', 'Outlander', 'Scholar', 'Soldier'];
  private flaws = ['Greedy', 'Cowardly', 'Arrogant', 'Impulsive'];
  private spells = ['Fireball', 'Heal', 'Invisibility', 'Lightning Bolt'];
  private features = ['Darkvision', 'Brave', 'Lucky', 'Spellcasting'];
  private feats = ['Sharpshooter', 'Tough', 'Alert', 'Resilient'];
  private expertise = ['Stealth', 'Arcana', 'Athletics', 'Persuasion'];

  override connectedCallback() {
    super.connectedCallback();
    this.loadDraft();
  }

  private loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      this.form = raw ? JSON.parse(raw) : {};
    } catch {
      this.form = {};
    }
  }

  private saveDraft() {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(this.form));
  }

  private clearDraft() {
    this.form = {};
    this.step = 0;
    this.error = null;
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  }

  private updateForm(next: Partial<Character>) {
    this.form = next;
    this.saveDraft();
  }

  private handleInput(e: Event) {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const name = target.name as keyof Character;
    if (target.type === 'checkbox') {
      const arr = [...((this.form[name] as string[]) ?? [])];
      if (target.checked) arr.push(target.value);
      else {
        const index = arr.indexOf(target.value);
        if (index >= 0) arr.splice(index, 1);
      }
      this.updateForm({ ...this.form, [name]: arr });
    } else {
      this.updateForm({ ...this.form, [name]: target.value });
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
    this.clearDraft();
  }

  private canMoveNext(step = this.step) {
    if (step === 0) return Boolean(this.form.name && this.form.race && this.form.class);
    if (step === 1) return Boolean(this.form.background && this.form.flaw);
    return true;
  }

  private goNext() {
    if (!this.canMoveNext()) {
      this.error = 'Please complete required fields before continuing.';
      return;
    }
    this.error = null;
    this.step = Math.min(STEPS.length - 1, this.step + 1);
  }

  private goBack() {
    this.error = null;
    this.step = Math.max(0, this.step - 1);
  }

  private renderCheckboxOptions(name: keyof Character, options: string[], selected: string[] = []) {
    return html`
      <div class="option-list">
        ${options.map((option) => html`
          <label>
            <input
              type="checkbox"
              name=${name}
              value=${option}
              @change=${this.handleInput}
              .checked=${selected.includes(option)} />
            ${option}
          </label>
        `)}
      </div>
    `;
  }

  private renderStepContent() {
    if (this.step === 0) {
      return html`
        <label>
          Name
          <input name="name" .value=${this.form.name ?? ''} @input=${this.handleInput} required />
        </label>
        <label>
          Race
          <select name="race" @change=${this.handleInput} required>
            <option value="">Select...</option>
            ${this.races.map((r) => html`<option value=${r} ?selected=${this.form.race === r}>${r}</option>`)}
          </select>
        </label>
        <label>
          Class
          <select name="class" @change=${this.handleInput} required>
            <option value="">Select...</option>
            ${this.classes.map((c) => html`<option value=${c} ?selected=${this.form.class === c}>${c}</option>`)}
          </select>
        </label>
      `;
    }

    if (this.step === 1) {
      return html`
        <label>
          Background
          <select name="background" @change=${this.handleInput} required>
            <option value="">Select...</option>
            ${this.backgrounds.map((b) => html`<option value=${b} ?selected=${this.form.background === b}>${b}</option>`)}
          </select>
        </label>
        <label>
          Flaw
          <select name="flaw" @change=${this.handleInput} required>
            <option value="">Select...</option>
            ${this.flaws.map((f) => html`<option value=${f} ?selected=${this.form.flaw === f}>${f}</option>`)}
          </select>
        </label>
      `;
    }

    if (this.step === 2) {
      return html`
        <fieldset>
          <legend>Spells</legend>
          ${this.renderCheckboxOptions('spells', this.spells, this.form.spells ?? [])}
        </fieldset>
        <fieldset>
          <legend>Features</legend>
          ${this.renderCheckboxOptions('features', this.features, this.form.features ?? [])}
        </fieldset>
        <fieldset>
          <legend>Feats</legend>
          ${this.renderCheckboxOptions('feats', this.feats, this.form.feats ?? [])}
        </fieldset>
        <fieldset>
          <legend>Expertise</legend>
          ${this.renderCheckboxOptions('expertise', this.expertise, this.form.expertise ?? [])}
        </fieldset>
      `;
    }

    return html`
      <div class="helper">Review your draft and create a read-only character sheet.</div>
      <label>
        Name
        <input .value=${this.form.name ?? ''} readonly />
      </label>
      <label>
        Race / Class
        <input .value=${[this.form.race, this.form.class].filter(Boolean).join(' / ')} readonly />
      </label>
      <label>
        Background / Flaw
        <input .value=${[this.form.background, this.form.flaw].filter(Boolean).join(' / ')} readonly />
      </label>
    `;
  }

  override render() {
    return html`
      <form @submit=${this.handleSubmit} autocomplete="off">
        <div class="tabs">
          ${STEPS.map((label, index) => html`<button type="button" class="tab ${index === this.step ? 'active' : ''}" @click=${() => (this.step = index)}>${label}</button>`)}
        </div>
        ${this.renderStepContent()}
        ${this.error ? html`<div style="color: red;">${this.error}</div>` : ''}
        <div class="actions">
          ${this.step > 0 ? html`<button type="button" @click=${this.goBack}>Back</button>` : ''}
          ${this.step < STEPS.length - 1
            ? html`<button type="button" @click=${this.goNext}>Next</button>`
            : html`<button type="submit">Create Character</button>`}
          <button type="button" @click=${this.clearDraft}>Reset</button>
        </div>
      </form>
    `;
  }
}
