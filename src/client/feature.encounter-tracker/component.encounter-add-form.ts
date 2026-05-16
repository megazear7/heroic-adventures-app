import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { Participant, ParticipantSchema } from "../../shared/type.encounter.js";

@customElement("encounter-add-form")
export class EncounterAddForm extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
    .form-card {
      background: var(--color-primary-surface-raised, #16162a);
      border: 1px solid rgba(201, 168, 76, 0.15);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .form-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-1, #c9a84c);
      margin: 0 0 1rem;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }
    .row {
      display: flex;
      gap: 0.75rem;
    }
    .row label {
      flex: 1;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--color-primary-text-muted, #8a8780);
    }
    input,
    select {
      font-size: 0.95rem;
      font-family: var(--font-family, sans-serif);
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      border: 1px solid rgba(201, 168, 76, 0.2);
      background: var(--color-primary-surface-overlay, #1e1e38);
      color: var(--color-primary-text, #e2e0d6);
      outline: none;
      transition: border-color 200ms ease;
      width: 100%;
      box-sizing: border-box;
    }
    input:focus,
    select:focus {
      border-color: var(--color-1, #c9a84c);
    }
    .hint {
      font-size: 0.72rem;
      color: var(--color-primary-text-muted, #8a8780);
      margin-top: 1px;
      line-height: 1.4;
    }
    .actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }
    button[type="submit"] {
      padding: 0.6rem 1.5rem;
      background: var(--color-1, #c9a84c);
      color: #1a1a2e;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 200ms ease;
      min-height: 44px;
      touch-action: manipulation;
    }
    button[type="submit"]:hover {
      opacity: 0.88;
    }
    .error {
      color: var(--color-error, #ff6b6b);
      font-size: 0.82rem;
    }
    @media (max-width: 480px) {
      .row {
        flex-direction: column;
      }
      .form-card {
        padding: 0.875rem;
        border-radius: 8px;
      }
    }
  `;

  @state() private name = "";
  @state() private type: "monster" | "player" = "monster";
  @state() private initiative = "1";
  @state() private maxHp = "";
  @state() private error: string | null = null;

  private handleSubmit(e: Event) {
    e.preventDefault();
    this.error = null;

    const hp = parseInt(this.maxHp, 10);
    const init = parseInt(this.initiative, 10);

    const candidate = {
      id: crypto.randomUUID(),
      name: this.name.trim(),
      type: this.type,
      initiative: isNaN(init) || init < 1 ? 1 : init,
      hp: isNaN(hp) ? 10 : hp,
      maxHp: isNaN(hp) ? 10 : hp,
      notes: "",
      conditions: [],
    };

    const result = ParticipantSchema.safeParse(candidate);
    if (!result.success) {
      this.error = "Please enter a valid name and max HP.";
      return;
    }

    this.dispatchEvent(
      new CustomEvent<Participant>("participant-added", {
        detail: result.data,
        bubbles: true,
        composed: true,
      }),
    );

    this.name = "";
    this.initiative = "1";
    this.maxHp = "";
    (e.target as HTMLFormElement).reset();
  }

  override render() {
    return html`
      <div class="form-card">
        <div class="form-title">Add Participant</div>
        <form @submit=${this.handleSubmit} autocomplete="off">
          <label>
            Name
            <input
              name="name"
              .value=${this.name}
              @input=${(e: Event) => (this.name = (e.target as HTMLInputElement).value)}
              placeholder="e.g. Goblin, Fighter"
              required />
          </label>
          <div class="row">
            <label>
              Type
              <select
                name="type"
                .value=${this.type}
                @change=${(e: Event) =>
                  (this.type = (e.target as HTMLSelectElement).value as "monster" | "player")}>
                <option value="monster">Monster</option>
                <option value="player">Player / PC</option>
              </select>
            </label>
            <label>
              Initiative
              <input
                name="initiative"
                type="number"
                min="1"
                step="1"
                .value=${this.initiative}
                @input=${(e: Event) => (this.initiative = (e.target as HTMLInputElement).value)}
                placeholder="1" />
              <span class="hint">Single initiative value — card ranges determine activation</span>
            </label>
            <label>
              Max HP
              <input
                name="maxHp"
                type="number"
                min="1"
                .value=${this.maxHp}
                @input=${(e: Event) => (this.maxHp = (e.target as HTMLInputElement).value)}
                placeholder="10"
                required />
            </label>
          </div>
          ${this.error
            ? html`
                <div class="error">${this.error}</div>
              `
            : ""}
          <div class="actions">
            <button type="submit">+ Add</button>
          </div>
        </form>
      </div>
    `;
  }
}
