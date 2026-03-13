import { css, html, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import { globalStyles } from "./styles.global.js";
import { HeroicAppProvider } from "./provider.app.js";
import { AppContext, appContext } from "./context.js";
import { getRecentEntries, RecentEntry, RECENTS_CHANGED_EVENT } from "../shared/service.recents.js";
import { leftArrowIcon, clockIcon } from "./icons.js";
import "./component.entry-list-item.js";

@customElement("heroic-recent-page")
export class HeroicRecentPage extends HeroicAppProvider {
  @consume({ context: appContext, subscribe: true })
  @property({ attribute: false })
  override appContext!: AppContext;

  @state() private recents: RecentEntry[] = [];

  private onRecentsChanged = (): void => {
    this.recents = getRecentEntries();
  };

  override connectedCallback(): Promise<void> {
    this.recents = getRecentEntries();
    window.addEventListener(RECENTS_CHANGED_EVENT, this.onRecentsChanged);
    return super.connectedCallback();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(RECENTS_CHANGED_EVENT, this.onRecentsChanged);
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
        <h1><span class="page-title">${clockIcon} Recently Viewed</span></h1>

        <div class="count">
          ${this.recents.length} ${this.recents.length === 1 ? "entry" : "entries"}
        </div>

        ${this.recents.length === 0
          ? html`<div class="empty">No recently viewed entries yet. Browse some content to see it here.</div>`
          : html`
              <div class="list">
                ${this.recents.map(
                  (r) => html`
                    <heroic-entry-list-item
                      entryTitle=${r.title}
                      slug=${r.slug}
                      categoryId=${r.categoryId}
                      categoryName=${this.getCategoryName(r.categoryId)}
                      imageUrl=${r.imageUrl ?? ""}
                      imageAlt=${r.imageAlt ?? r.title}></heroic-entry-list-item>
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
