import { html, css, LitElement, TemplateResult, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { globalStyles } from "./styles.global.js";
import { starIcon, starFilledIcon, pinIcon, pinFilledIcon } from "./icons.js";
import { isFavorite, toggleFavorite, FAVORITES_CHANGED_EVENT } from "../shared/service.favorites.js";
import { isBookmarked, toggleBookmark, BOOKMARKS_CHANGED_EVENT } from "../shared/service.bookmarks.js";

@customElement("heroic-entry-list-item")
export class HeroicEntryListItem extends LitElement {
  static override styles = [
    globalStyles,
    css`
      a {
        display: block;
        text-decoration: none !important;
        color: inherit;
      }

      .item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 14px 18px;
        background: var(--color-primary-surface-raised);
        border: var(--border-normal);
        border-radius: var(--border-radius-small);
        transition: var(--transition-all);
        cursor: pointer;
      }

      .item:hover {
        border-color: rgba(201, 168, 76, 0.35);
        box-shadow: var(--shadow-glow);
        transform: translateY(-1px);
      }

      .thumb {
        width: 48px;
        height: 48px;
        border-radius: var(--border-radius-small);
        object-fit: cover;
        background: var(--color-primary-surface-overlay);
        flex-shrink: 0;
      }

      .info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-width: 0;
      }

      .title {
        font-size: var(--font-medium);
        font-weight: 500;
        color: var(--color-primary-text);
        transition: color var(--time-fast) ease;
      }

      .category-label {
        font-size: var(--font-tiny);
        color: var(--color-primary-text-muted);
      }

      .item:hover .title {
        color: var(--color-1);
      }

      .fav-indicator {
        color: var(--color-1);
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }

      .fav-indicator svg {
        width: 16px;
        height: 16px;
      }

      .fav-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 6px;
        color: var(--color-primary-text-muted);
        display: flex;
        align-items: center;
        flex-shrink: 0;
        transition: color var(--time-fast) ease, transform var(--time-fast) ease;
        z-index: 1;
      }

      .fav-btn:hover {
        color: var(--color-1);
        transform: scale(1.15);
      }

      .fav-btn.active {
        color: var(--color-1);
      }

      .fav-btn svg {
        width: 16px;
        height: 16px;
      }

      .pin-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 6px;
        color: var(--color-primary-text-muted);
        display: flex;
        align-items: center;
        flex-shrink: 0;
        transition: color var(--time-fast) ease, transform var(--time-fast) ease;
        z-index: 1;
      }

      .pin-btn:hover {
        color: var(--color-1);
        transform: scale(1.15);
      }

      .pin-btn.active {
        color: var(--color-1);
      }

      .pin-btn svg {
        width: 14px;
        height: 14px;
      }
    `,
  ];

  @property({ type: String }) entryTitle = "";
  @property({ type: String }) slug = "";
  @property({ type: String }) categoryId = "";
  @property({ type: String }) imageUrl = "";
  @property({ type: String }) imageAlt = "";
  @property({ type: String }) categoryName = "";
  @state() private favorited = false;
  @state() private bookmarked = false;

  private onFavoritesChanged = (): void => {
    this.favorited = isFavorite(this.categoryId, this.slug);
  };

  private onBookmarksChanged = (): void => {
    this.bookmarked = isBookmarked(this.categoryId, this.slug);
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.favorited = isFavorite(this.categoryId, this.slug);
    this.bookmarked = isBookmarked(this.categoryId, this.slug);
    window.addEventListener(FAVORITES_CHANGED_EVENT, this.onFavoritesChanged);
    window.addEventListener(BOOKMARKS_CHANGED_EVENT, this.onBookmarksChanged);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(FAVORITES_CHANGED_EVENT, this.onFavoritesChanged);
    window.removeEventListener(BOOKMARKS_CHANGED_EVENT, this.onBookmarksChanged);
  }

  override render(): TemplateResult {
    return html`
      <a href="/${this.categoryId}/${this.slug}">
        <div class="item">
          ${this.imageUrl
            ? html`
                <img class="thumb" src="${this.imageUrl}" alt="${this.imageAlt}" loading="lazy" />
              `
            : ""}
          <span class="info">
            <span class="title">${this.entryTitle}</span>
            ${this.categoryName
              ? html`<span class="category-label">${this.categoryName}</span>`
              : nothing}
          </span>
          <button
            class="pin-btn ${this.bookmarked ? "active" : ""}"
            @click=${this.handleToggleBookmark}
            title=${this.bookmarked ? "Unpin from quick reference" : "Pin to quick reference"}
            aria-label=${this.bookmarked ? "Unpin from quick reference" : "Pin to quick reference"}>
            ${this.bookmarked ? pinFilledIcon : pinIcon}
          </button>
          <button
            class="fav-btn ${this.favorited ? "active" : ""}"
            @click=${this.handleToggleFavorite}
            title=${this.favorited ? "Remove from favorites" : "Add to favorites"}
            aria-label=${this.favorited ? "Remove from favorites" : "Add to favorites"}>
            ${this.favorited ? starFilledIcon : starIcon}
          </button>
        </div>
      </a>
    `;
  }

  private handleToggleFavorite(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    this.favorited = toggleFavorite({
      categoryId: this.categoryId,
      slug: this.slug,
      title: this.entryTitle,
      imageUrl: this.imageUrl || undefined,
      imageAlt: this.imageAlt || undefined,
    });
  }

  private handleToggleBookmark(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    this.bookmarked = toggleBookmark({
      categoryId: this.categoryId,
      slug: this.slug,
      title: this.entryTitle,
      imageUrl: this.imageUrl || undefined,
      imageAlt: this.imageAlt || undefined,
    });
  }
}
