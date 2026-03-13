import { css, html, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import { globalStyles } from "./styles.global.js";
import { HeroicAppProvider } from "./provider.app.js";
import { AppContext, appContext } from "./context.js";
import { getFavorites, FavoriteEntry, FAVORITES_CHANGED_EVENT } from "../shared/service.favorites.js";
import { leftArrowIcon, starIcon } from "./icons.js";
import "./component.entry-list-item.js";

@customElement("heroic-favorites-page")
export class HeroicFavoritesPage extends HeroicAppProvider {
  @consume({ context: appContext, subscribe: true })
  @property({ attribute: false })
  override appContext!: AppContext;

  @state() private favorites: FavoriteEntry[] = [];

  private onFavoritesChanged = (): void => {
    this.favorites = getFavorites();
  };

  override connectedCallback(): Promise<void> {
    this.favorites = getFavorites();
    window.addEventListener(FAVORITES_CHANGED_EVENT, this.onFavoritesChanged);
    return super.connectedCallback();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(FAVORITES_CHANGED_EVENT, this.onFavoritesChanged);
  }

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

      .page-title {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .page-title svg {
        width: 24px;
        height: 24px;
        color: var(--color-1);
      }

      .count {
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
        margin-bottom: 16px;
      }

      .list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .empty {
        text-align: center;
        padding: 2rem;
        color: var(--color-primary-text-muted);
      }
    `,
  ];

  override render(): TemplateResult {
    return html`
      <main>
        <a href="/" class="back-link">${leftArrowIcon} Home</a>
        <h1><span class="page-title">${starIcon} Favorites</span></h1>

        <div class="count">
          ${this.favorites.length} ${this.favorites.length === 1 ? "entry" : "entries"}
        </div>

        ${this.favorites.length === 0
          ? html`<div class="empty">No favorites yet. Star entries to save them here.</div>`
          : html`
              <div class="list">
                ${this.favorites.map(
                  (f) => html`
                    <heroic-entry-list-item
                      entryTitle=${f.title}
                      slug=${f.slug}
                      categoryId=${f.categoryId}
                      categoryName=${this.getCategoryName(f.categoryId)}
                      imageUrl=${f.imageUrl ?? ""}
                      imageAlt=${f.imageAlt ?? f.title}></heroic-entry-list-item>
                  `,
                )}
              </div>
            `}
      </main>
    `;
  }

  private getCategoryName(categoryId: string): string {
    const categories = this.appContext?.categories ?? [];
    return categories.find((c) => c.id === categoryId)?.name ?? "";
  }
}
