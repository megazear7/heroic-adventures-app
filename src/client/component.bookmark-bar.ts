import { html, css, LitElement, TemplateResult, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { globalStyles } from "./styles.global.js";
import { closeIcon } from "./icons.js";
import {
  getBookmarks,
  removeBookmark,
  BookmarkEntry,
  BOOKMARKS_CHANGED_EVENT,
} from "../shared/service.bookmarks.js";

@customElement("heroic-bookmark-bar")
export class HeroicBookmarkBar extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        display: block;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 998;
        pointer-events: none;
      }

      .bar {
        display: flex;
        align-items: stretch;
        gap: 8px;
        padding: 10px 16px;
        background: var(--color-primary-surface-raised);
        border-top: 1px solid rgba(201, 168, 76, 0.18);
        backdrop-filter: blur(12px);
        pointer-events: auto;
        animation: slideUp var(--time-normal) ease;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .bar::-webkit-scrollbar {
        display: none;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(100%);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .slot {
        position: relative;
        display: flex;
        align-items: center;
        flex: 1 1 0;
        min-width: 0;
        max-width: 200px;
      }

      .slot-link {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 28px 8px 10px;
        background: var(--color-primary-surface-overlay);
        border: 1px solid rgba(201, 168, 76, 0.1);
        border-radius: var(--border-radius-small);
        text-decoration: none;
        color: var(--color-primary-text);
        font-size: 0.8rem;
        font-weight: 500;
        transition: var(--transition-all);
        width: 100%;
        min-width: 0;
      }

      .slot-link:hover {
        border-color: rgba(201, 168, 76, 0.35);
        box-shadow: var(--shadow-glow);
      }

      .slot-thumb {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        object-fit: cover;
        flex-shrink: 0;
      }

      .slot-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .remove-btn {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: none;
        background: var(--color-primary-surface-overlay);
        color: var(--color-primary-text-muted);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        transition: var(--transition-fast);
        z-index: 1;
      }

      .remove-btn:hover {
        background: var(--color-1);
        color: var(--color-primary-surface);
      }

      .remove-btn svg {
        width: 10px;
        height: 10px;
      }
    `,
  ];

  @state() private bookmarks: BookmarkEntry[] = [];

  private onBookmarksChanged = (): void => {
    this.bookmarks = getBookmarks();
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.bookmarks = getBookmarks();
    window.addEventListener(BOOKMARKS_CHANGED_EVENT, this.onBookmarksChanged);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(BOOKMARKS_CHANGED_EVENT, this.onBookmarksChanged);
  }

  override render(): TemplateResult | typeof nothing {
    if (this.bookmarks.length === 0) return nothing;

    return html`
      <div class="bar" role="navigation" aria-label="Quick reference bookmarks">
        ${this.bookmarks.map(
          (b) => html`
            <div class="slot">
              <a class="slot-link" href="/${b.categoryId}/${b.slug}" title="${b.title}">
                ${b.imageUrl
                  ? html`<img class="slot-thumb" src="${b.imageUrl}" alt="${b.imageAlt ?? ""}" />`
                  : ""}
                <span class="slot-title">${b.title}</span>
              </a>
              <button
                class="remove-btn"
                @click=${(e: Event) => this.handleRemove(e, b)}
                title="Unpin ${b.title}"
                aria-label="Unpin ${b.title}">
                ${closeIcon}
              </button>
            </div>
          `,
        )}
      </div>
    `;
  }

  private handleRemove(e: Event, bookmark: BookmarkEntry): void {
    e.preventDefault();
    e.stopPropagation();
    removeBookmark(bookmark.categoryId, bookmark.slug);
  }
}
