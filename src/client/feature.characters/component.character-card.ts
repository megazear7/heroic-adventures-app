import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { globalStyles } from "../styles.global.js";
import { deleteCharacter } from "../../shared/service.characters.js";
import { Character, CharacterContentLink } from "../../shared/type.character.js";
import "./component.character-linked-entry-card.js";

@customElement("character-card")
export class CharacterCard extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        display: block;
      }

      .sheet {
        display: grid;
        gap: var(--size-large);
        padding: var(--size-large);
        background: var(--color-primary-surface-raised);
        border: var(--border-normal);
        border-radius: var(--border-radius-medium);
        box-shadow: var(--shadow-normal);
      }

      .header {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: var(--size-medium);
        flex-wrap: wrap;
      }

      .summary {
        display: flex;
        gap: var(--size-small);
        flex-wrap: wrap;
      }

      .pill {
        border: var(--border-normal);
        border-radius: 999px;
        padding: 6px 10px;
        font-size: var(--font-tiny);
        color: var(--color-primary-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .grid {
        display: grid;
        gap: var(--size-medium);
      }

      .grid.two-up {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .section {
        display: grid;
        gap: var(--size-small);
      }

      .actions {
        display: flex;
        gap: var(--size-small);
        flex-wrap: wrap;
      }

      .feedback {
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
      }

      @media (max-width: 800px) {
        .grid.two-up {
          grid-template-columns: 1fr;
        }
      }
    `,
  ];

  @property({ attribute: false }) character!: Character;
  @state() private feedback = "";

  private async copyCharacter(): Promise<void> {
    try {
      await navigator.clipboard.writeText(JSON.stringify(this.character, null, 2));
      this.feedback = "Character copied to clipboard.";
    } catch {
      this.feedback = "Clipboard unavailable.";
    }
  }

  private async shareCharacter(): Promise<void> {
    const text = `${this.character.name} • ${this.character.race.title} ${this.character.class.title}`;
    if (!("share" in navigator)) {
      await this.copyCharacter();
      return;
    }
    navigator
      .share({
        title: `Heroic Adventures Character: ${this.character.name}`,
        text,
      })
      .catch(() => {
        this.feedback = "Share canceled.";
      });
  }

  private sanitizeFileName(name: string): string {
    if (!name.trim()) return "character";
    return (
      name
        .replace(/[^a-z0-9-_]+/gi, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase() || "character"
    );
  }

  private exportCharacter(): void {
    const blob = new Blob([JSON.stringify(this.character, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${this.sanitizeFileName(this.character.name)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    this.feedback = "Character exported.";
  }

  private removeCharacter = (): void => {
    deleteCharacter(this.character.id);
  };

  override render(): TemplateResult {
    if (!this.character) return html``;
    const c = this.character;
    return html`
      <div class="sheet">
        <div class="header">
          <div>
            <h2>${c.name}</h2>
            <div class="summary">
              <span class="pill">${c.race.title}</span>
              <span class="pill">${c.class.title}</span>
              <span class="pill">${c.background.title}</span>
              <span class="pill">${c.flaw.title}</span>
            </div>
          </div>
          <div class="actions">
            <button class="btn" type="button" @click=${this.shareCharacter}>Share</button>
            <button class="btn" type="button" @click=${this.exportCharacter}>Export JSON</button>
            <button class="btn" type="button" @click=${this.copyCharacter}>Copy</button>
            <button class="btn" type="button" @click=${this.removeCharacter}>Delete</button>
          </div>
        </div>

        <div class="grid two-up">
          ${this.renderSection("Identity", [c.race, c.class, c.background, c.flaw])}
          ${this.renderSection("Gear", c.gear)}
        </div>

        <div class="grid two-up">
          ${this.renderSection("Features", c.features)} ${this.renderSection("Feats", c.feats)}
          ${this.renderSection("Expertise", c.expertise)} ${this.renderSection("Spells", c.spells)}
        </div>

        ${this.feedback
          ? html`
              <div class="feedback">${this.feedback}</div>
            `
          : ""}
      </div>
    `;
  }

  private renderSection(label: string, entries: CharacterContentLink[]): TemplateResult {
    return html`
      <section class="section">
        <h3>${label}</h3>
        ${entries.length === 0
          ? html`
              <div class="muted">Nothing selected yet.</div>
            `
          : entries.map(
              (entry) => html`
                <character-linked-entry-card .selection=${entry}></character-linked-entry-card>
              `,
            )}
      </section>
    `;
  }
}
