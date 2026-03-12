import { html, css, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { globalStyles } from "./styles.global.js";
import { closeIcon, starFilledIcon } from "./icons.js";
import { ContentCategory } from "../shared/type.content.js";
import { getFavorites, FAVORITES_CHANGED_EVENT } from "../shared/service.favorites.js";

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
      }

      .drawer.open {
        transform: translateX(0);
      }

      .drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
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
        padding: 4px;
        display: flex;
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
    `,
  ];

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Array })
  categories: ContentCategory[] = [];

  @state() private favCount = 0;

  private onFavoritesChanged = (): void => {
    this.favCount = getFavorites().length;
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.favCount = getFavorites().length;
    window.addEventListener(FAVORITES_CHANGED_EVENT, this.onFavoritesChanged);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(FAVORITES_CHANGED_EVENT, this.onFavoritesChanged);
  }

  override render(): TemplateResult {
    const core = this.categories.filter((c) => !c.category.startsWith("spell") && !c.category.startsWith("item"));
    const spells = this.categories.filter((c) => c.category.startsWith("spell"));
    const items = this.categories.filter((c) => c.category.startsWith("item"));

    return html`
      <div class="overlay ${this.open ? "open" : ""}" @click=${this.close}></div>
      <nav class="drawer ${this.open ? "open" : ""}">
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
                  <a href="/" @click=${this.close}>
                    <span class="fav-link-inner">${starFilledIcon} Favorites</span>
                    <span class="nav-count">${this.favCount}</span>
                  </a>
                </li>
              `
            : ""}
          <li class="nav-item">
            <a href="/search" @click=${this.close}>Search All</a>
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
    this.dispatchEvent(new CustomEvent("drawer-close"));
  }
}
