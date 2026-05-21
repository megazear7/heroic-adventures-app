import { html, css, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { globalStyles } from "./styles.global.js";
import { closeIcon, starFilledIcon, clockIcon } from "./icons.js";
import { ContentCategory } from "../shared/type.content.js";
import { getFavorites, FAVORITES_CHANGED_EVENT } from "../shared/service.favorites.js";
import { getRecentEntries, RECENTS_CHANGED_EVENT } from "../shared/service.recents.js";

@customElement("heroic-nav-drawer")
export class HeroicNavDrawer extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        display: block;
      }

      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        z-index: 1000;
        opacity: 0;
        pointer-events: none;
        transition: opacity var(--time-normal) ease;
      }

      .overlay.open {
        opacity: 1;
        pointer-events: auto;
      }

      .drawer {
        position: fixed;
        top: 0;
        left: 0;
        width: var(--sidebar-width);
        height: 100vh;
        background: var(--color-primary-surface-raised);
        border-right: var(--border-normal);
        z-index: 1001;
        transform: translateX(-100%);
        transition: transform var(--time-normal) cubic-bezier(0.4, 0, 0.2, 1);
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        touch-action: pan-y;
        will-change: transform;
      }

      .drawer.open {
        transform: translateX(0);
      }

      .drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: calc(16px + env(safe-area-inset-top, 0px)) 20px 16px;
        border-bottom: var(--border-normal);
      }

      .drawer-title {
        font-family: var(--font-family-display);
        font-size: var(--font-large);
        color: var(--color-1);
        margin: 0;
      }

      .close-btn {
        background: none;
        border: none;
        color: var(--color-primary-text-muted);
        cursor: pointer;
        min-width: 44px;
        min-height: 44px;
        padding: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: var(--transition-fast);
      }

      .close-btn:hover {
        color: var(--color-primary-text);
      }

      .nav-list {
        list-style: none;
        margin: 0;
        padding: 8px 0;
        flex: 1;
      }

      .nav-item a {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 20px;
        min-height: 48px;
        color: var(--color-primary-text);
        text-decoration: none;
        font-size: var(--font-small);
        transition: var(--transition-fast);
      }

      .nav-item a:hover {
        background: var(--color-primary-surface-overlay);
        color: var(--color-1);
      }

      .nav-count {
        font-size: var(--font-tiny);
        color: var(--color-primary-text-muted);
        background: var(--color-primary-surface-overlay);
        padding: 2px 8px;
        border-radius: 10px;
      }

      .nav-section {
        padding: 12px 20px 4px;
        font-size: var(--font-tiny);
        color: var(--color-primary-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-weight: 600;
      }

      .home-link a {
        color: var(--color-1);
        font-weight: 500;
      }

      .fav-link a {
        color: var(--color-1);
        font-weight: 500;
      }

      .fav-link-inner {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .fav-link-inner svg {
        width: 14px;
        height: 14px;
      }

      .recent-link a {
        color: var(--color-1);
        font-weight: 500;
      }

      .recent-link-inner {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .recent-link-inner svg {
        width: 14px;
        height: 14px;
      }
    `,
  ];

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Array })
  categories: ContentCategory[] = [];

  @state() private favCount = 0;
  @state() private recentCount = 0;
  @state() private swipeStartX: number | null = null;
  @state() private swipeStartY: number | null = null;

  private onFavoritesChanged = (): void => {
    this.favCount = getFavorites().length;
  };

  private onRecentsChanged = (): void => {
    this.recentCount = getRecentEntries().length;
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.favCount = getFavorites().length;
    this.recentCount = getRecentEntries().length;
    window.addEventListener(FAVORITES_CHANGED_EVENT, this.onFavoritesChanged);
    window.addEventListener(RECENTS_CHANGED_EVENT, this.onRecentsChanged);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(FAVORITES_CHANGED_EVENT, this.onFavoritesChanged);
    window.removeEventListener(RECENTS_CHANGED_EVENT, this.onRecentsChanged);
  }

  override render(): TemplateResult {
    const core = this.categories.filter((c) => !c.category.startsWith("spell") && !c.category.startsWith("item"));
    const spells = this.categories.filter((c) => c.category.startsWith("spell"));
    const items = this.categories.filter((c) => c.category.startsWith("item"));

    return html`
      <div class="overlay ${this.open ? "open" : ""}" @click=${this.close}></div>
      <nav
        class="drawer ${this.open ? "open" : ""}"
        @pointerdown=${this.handleDrawerPointerDown}
        @pointerup=${this.handleDrawerPointerUp}
        @pointercancel=${this.resetSwipeState}>
        <div class="drawer-header">
          <span class="drawer-title">Menu</span>
          <button class="close-btn" @click=${this.close}>${closeIcon}</button>
        </div>
        <ul class="nav-list">
          <li class="nav-item home-link">
            <a href="/" @click=${this.close}>Home</a>
          </li>
          ${this.favCount > 0
            ? html`
                <li class="nav-item fav-link">
                  <a href="/favorites" @click=${this.close}>
                    <span class="fav-link-inner">${starFilledIcon} Favorites</span>
                    <span class="nav-count">${this.favCount}</span>
                  </a>
                </li>
              `
            : ""}
          ${this.recentCount > 0
            ? html`
                <li class="nav-item recent-link">
                  <a href="/recent" @click=${this.close}>
                    <span class="recent-link-inner">${clockIcon} Recent</span>
                    <span class="nav-count">${this.recentCount}</span>
                  </a>
                </li>
              `
            : ""}

          <li class="nav-item">
            <a href="/search" @click=${this.close}>Search All</a>
          </li>

          <li class="nav-item">
            <a href="/characters" @click=${this.close}>Characters</a>
          </li>

          <li class="nav-item">
            <a href="/adventure-log" @click=${this.close}>Adventure Log</a>
          </li>

          <li class="nav-item">
            <a href="/encounters" @click=${this.close}>Encounters</a>
          </li>
          <li class="nav-item">
            <a href="/monster-templates" @click=${this.close}>Monster Templates</a>
          </li>

          <li class="nav-section">Core</li>
          ${core.map(
            (c) => html`
              <li class="nav-item">
                <a href="/${c.id}" @click=${this.close}>
                  ${c.name}
                  <span class="nav-count">${c.count}</span>
                </a>
              </li>
            `,
          )}
          ${spells.length
            ? html`
                <li class="nav-section">Spells</li>
                ${spells.map(
                  (c) => html`
                    <li class="nav-item">
                      <a href="/${c.id}" @click=${this.close}>
                        ${c.name}
                        <span class="nav-count">${c.count}</span>
                      </a>
                    </li>
                  `,
                )}
              `
            : ""}
          ${items.length
            ? html`
                <li class="nav-section">Items</li>
                ${items.map(
                  (c) => html`
                    <li class="nav-item">
                      <a href="/${c.id}" @click=${this.close}>
                        ${c.name}
                        <span class="nav-count">${c.count}</span>
                      </a>
                    </li>
                  `,
                )}
              `
            : ""}
        </ul>
      </nav>
    `;
  }

  private close(): void {
    this.open = false;
    this.resetSwipeState();
    this.dispatchEvent(new CustomEvent("drawer-close"));
  }

  private handleDrawerPointerDown = (event: PointerEvent): void => {
    if (!this.open || event.pointerType === "mouse") return;
    this.swipeStartX = event.clientX;
    this.swipeStartY = event.clientY;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  private handleDrawerPointerUp = (event: PointerEvent): void => {
    if (!this.open || this.swipeStartX === null || this.swipeStartY === null) {
      this.resetSwipeState();
      return;
    }
    const deltaX = event.clientX - this.swipeStartX;
    const deltaY = Math.abs(event.clientY - this.swipeStartY);
    // Close if the gesture is a deliberate left swipe:
    // horizontal movement of at least 64px to the left and vertical drift no greater than 56px.
    if (deltaX <= -64 && deltaY <= 56) {
      this.close();
      return;
    }
    this.resetSwipeState();
  };

  private resetSwipeState = (): void => {
    this.swipeStartX = null;
    this.swipeStartY = null;
  };
}
