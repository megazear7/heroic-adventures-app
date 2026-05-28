import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { AdventureLogSchema, AdventureLog } from "../../shared/type.adventure-log";

@customElement("adventure-log-create-form")
export class AdventureLogCreateForm extends LitElement {
  static override styles = css`
    :host {
      display: block;
      max-width: 600px;
      margin: 0 auto;
      padding: var(--size-lg);
      background: var(--color-primary-surface-raised);
      border: 1px solid rgba(201, 168, 76, 0.15);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    form {
      display: flex;
      flex-direction: column;
      gap: var(--size-md);
    }
    label {
      display: flex;
      flex-direction: column;
      gap: var(--size-2xs);
      font-size: var(--size-0-875);
      font-weight: 500;
      color: var(--color-primary-text-muted);
    }
    input,
    textarea {
      font-size: var(--size-md);
      font-family: var(--font-family);
      padding: var(--size-xs) var(--size-sm);
      border-radius: 6px;
      border: 1px solid rgba(201, 168, 76, 0.2);
      background: var(--color-primary-surface-overlay);
      color: var(--color-primary-text);
      outline: none;
      transition: border-color 200ms ease;
    }
    input:focus,
    textarea:focus {
      border-color: var(--color-1);
    }
    textarea {
      min-height: 100px;
      resize: vertical;
    }
    .row {
      display: flex;
      gap: var(--size-sm);
    }
    .row label {
      flex: 1;
    }
    .hint {
      font-size: var(--size-sm);
      color: var(--color-primary-text-muted);
      margin-top: var(--size-3xs);
    }
    .error {
      color: var(--color-error);
      font-size: var(--size-0-85);
    }
    button[type="submit"] {
      align-self: flex-start;
      padding: var(--size-xs) var(--size-lg);
      background: var(--color-1);
      color: #1a1a2e;
      border: none;
      border-radius: 6px;
      font-size: var(--size-0-95);
      font-weight: 600;
      cursor: pointer;
      transition: opacity 200ms ease;
    }
    button[type="submit"]:hover {
      opacity: 0.88;
    }
    @media (max-width: 600px) {
      :host {
        padding: var(--size-sm);
        max-width: 100%;
        border-radius: 8px;
      }
      .row {
        flex-direction: column;
        gap: var(--size-md);
      }
    }
  `;

  @state() private form: Partial<AdventureLog> = {};
  @state() private tagsRaw = "";
  @state() private error: string | null = null;

  private handleInput(e: Event) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const name = target.name as keyof AdventureLog;
    if (name === "session") {
      this.form = { ...this.form, session: parseInt(target.value, 10) || 1 };
    } else if (name === "tags") {
      this.tagsRaw = target.value;
    } else {
      this.form = { ...this.form, [name]: target.value };
    }
  }

  private handleSubmit(e: Event) {
    e.preventDefault();
    this.error = null;
    const tags = this.tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const now = Date.now();
    const candidate = {
      ...this.form,
      id: crypto.randomUUID(),
      tags,
      characterIds: [],
      createdAt: now,
      updatedAt: now,
      session: this.form.session ?? 1,
      summary: this.form.summary ?? "",
      date: this.form.date ?? "",
    };
    const result = AdventureLogSchema.safeParse(candidate);
    if (!result.success) {
      this.error = "Please fill all required fields.";
      return;
    }
    this.dispatchEvent(
      new CustomEvent("log-created", {
        detail: result.data,
        bubbles: true,
        composed: true,
      }),
    );
    this.form = {};
    this.tagsRaw = "";
    // Explicitly reset the form element to clear browser-native state
    (e.target as HTMLFormElement).reset();
  }

  override render() {
    return html`
      <form @submit=${this.handleSubmit} autocomplete="off">
        <label>
          Title
          <input name="title" .value=${this.form.title ?? ""} @input=${this.handleInput} required />
        </label>
        <div class="row">
          <label>
            Session #
            <input
              name="session"
              type="number"
              min="1"
              .value=${String(this.form.session ?? "")}
              @input=${this.handleInput}
              required />
          </label>
          <label>
            Date
            <input name="date" type="date" .value=${this.form.date ?? ""} @input=${this.handleInput} />
          </label>
        </div>
        <label>
          Summary / Notes
          <textarea name="summary" .value=${this.form.summary ?? ""} @input=${this.handleInput}></textarea>
        </label>
        <label>
          Tags
          <input
            name="tags"
            .value=${this.tagsRaw}
            @input=${this.handleInput}
            placeholder="e.g. combat, dungeon, roleplay" />
          <span class="hint">Separate multiple tags with commas.</span>
        </label>
        ${this.error
          ? html`
              <div class="error">${this.error}</div>
            `
          : ""}
        <button type="submit">Add Log Entry</button>
      </form>
    `;
  }
}
