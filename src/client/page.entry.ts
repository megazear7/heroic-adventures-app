import { css, html, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import { globalStyles } from "./styles.global.js";
import { HeroicAppProvider } from "./provider.app.js";
import { AppContext, appContext } from "./context.js";
import { ContentEntry } from "../shared/type.content.js";
import { leftArrowIcon, starIcon, starFilledIcon } from "./icons.js";
import { isFavorite, toggleFavorite, FAVORITES_CHANGED_EVENT } from "../shared/service.favorites.js";
import { recordRecentEntry } from "../shared/service.recents.js";
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
  @state() private favorited = false;

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

      .entry-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }

      .favorite-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 6px;
        color: var(--color-primary-text-muted);
        display: flex;
        align-items: center;
        transition: color var(--time-fast) ease, transform var(--time-fast) ease;
        flex-shrink: 0;
      }

      .favorite-btn:hover {
        color: var(--color-1);
        transform: scale(1.15);
      }

      .favorite-btn.active {
        color: var(--color-1);
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

  private onFavoritesChanged = (): void => {
    if (this.entry) {
      this.favorited = isFavorite(this.categoryId, this.entry.slug);
    }
  };

  override connectedCallback(): Promise<void> {
    window.addEventListener(FAVORITES_CHANGED_EVENT, this.onFavoritesChanged);
    return super.connectedCallback();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(FAVORITES_CHANGED_EVENT, this.onFavoritesChanged);
  }

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
      this.favorited = isFavorite(this.categoryId, this.entry.slug);
      recordRecentEntry({
        categoryId: this.categoryId,
        slug: this.entry.slug,
        title: this.entry.title,
        imageUrl: this.entry.heroImage?.url,
        imageAlt: this.entry.heroImage?.alt,
      });
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
        <div class="entry-header">
          <a href="/${this.categoryId}" class="back-link">${leftArrowIcon} ${catName}</a>
          <button
            class="favorite-btn ${this.favorited ? "active" : ""}"
            @click=${this.handleToggleFavorite}
            title=${this.favorited ? "Remove from favorites" : "Add to favorites"}
            aria-label=${this.favorited ? "Remove from favorites" : "Add to favorites"}>
            ${this.favorited ? starFilledIcon : starIcon}
          </button>
        </div>

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

  private handleToggleFavorite(): void {
    if (!this.entry) return;
    this.favorited = toggleFavorite({
      categoryId: this.categoryId,
      slug: this.entry.slug,
      title: this.entry.title,
      imageUrl: this.entry.heroImage?.url,
      imageAlt: this.entry.heroImage?.alt,
    });
  }
}
