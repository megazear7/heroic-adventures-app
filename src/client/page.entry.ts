import { css, html, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import { globalStyles } from "./styles.global.js";
import { HeroicAppProvider } from "./provider.app.js";
import { AppContext, appContext } from "./context.js";
import { ContentEntry } from "../shared/type.content.js";
import { leftArrowIcon } from "./icons.js";
import "./component.content-viewer.js";

@customElement("heroic-entry-page")
export class HeroicEntryPage extends HeroicAppProvider {
  @consume({ context: appContext, subscribe: true })
  @property({ attribute: false })
  override appContext!: AppContext;

  @state() private entry: ContentEntry | null = null;
  @state() private contentHtml = "";
  @state() private loading = true;
  @state() private categoryId = "";

  static override styles = [
    globalStyles,
    css`
      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--color-primary-text-muted);
        text-decoration: none;
        font-size: var(--font-small);
        transition: var(--transition-fast);
        margin-bottom: 20px;
      }

      .back-link:hover {
        color: var(--color-1);
      }

      .hero-image {
        width: 100%;
        max-height: 300px;
        object-fit: cover;
        border-radius: var(--border-radius-medium);
        margin-bottom: 24px;
      }

      .entry-header {
        margin-bottom: 24px;
      }

      .entry-meta {
        font-size: var(--font-small);
        color: var(--color-primary-text-muted);
        margin-top: 4px;
      }

      .content-card {
        background: var(--color-primary-surface-raised);
        border: var(--border-normal);
        border-radius: var(--border-radius-medium);
        padding: 24px;
      }

      .error {
        text-align: center;
        padding: 2rem;
        color: var(--color-primary-text-muted);
      }
    `,
  ];

  override async load(): Promise<void> {
    await super.load();
    await this.loadEntry();
  }

  private async loadEntry(): Promise<void> {
    const path = window.location.pathname;
    const parts = path.split("/").filter(Boolean);
    this.categoryId = parts[0] ?? "";
    const slug = parts[1] ?? "";

    try {
      const [entryRes, contentRes] = await Promise.all([
        fetch(`/content/${this.categoryId}/${slug}/entry.json`),
        fetch(`/content/${this.categoryId}/${slug}/content`),
      ]);
      if (!entryRes.ok) throw new Error("Entry not found");
      const entryData = await entryRes.json();
      this.entry = ContentEntry.parse(entryData);
      this.contentHtml = contentRes.ok ? await contentRes.text() : "";
    } catch {
      this.entry = null;
      this.contentHtml = "";
    }
    this.loading = false;
  }

  override render(): TemplateResult {
    const catName = this.appContext?.categories?.find((c) => c.id === this.categoryId)?.name ?? this.categoryId;

    if (this.loading) {
      return html`
        <main>
          <heroic-content-viewer .loading=${true}></heroic-content-viewer>
        </main>
      `;
    }

    if (!this.entry) {
      return html`
        <main>
          <a href="/${this.categoryId}" class="back-link">${leftArrowIcon} ${catName}</a>
          <div class="error">Entry not found.</div>
        </main>
      `;
    }

    return html`
      <main>
        <a href="/${this.categoryId}" class="back-link">${leftArrowIcon} ${catName}</a>

        ${this.entry.heroImage
          ? html`
              <img class="hero-image" src="${this.entry.heroImage.url}" alt="${this.entry.heroImage.alt}" />
            `
          : ""}

        <div class="content-card">
          <heroic-content-viewer .contentHtml=${this.contentHtml}></heroic-content-viewer>
        </div>
      </main>
    `;
  }
}
