import { css, html, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import { globalStyles } from "./styles.global.js";
import { HeroicAppProvider } from "./provider.app.js";
import { AppContext, appContext } from "./context.js";
import { ContentListItem } from "../shared/type.content.js";
import { leftArrowIcon } from "./icons.js";
import "./component.entry-list-item.js";
import "./component.search-bar.js";

@customElement("heroic-category-page")
export class HeroicCategoryPage extends HeroicAppProvider {
  @consume({ context: appContext, subscribe: true })
  @property({ attribute: false })
  override appContext!: AppContext;

  @state() private items: ContentListItem[] = [];
  @state() private filteredItems: ContentListItem[] = [];
  @state() private categoryName = "";
  @state() private categoryId = "";
  @state() private loading = true;
  @state() private filterText = "";

  static override styles = [
    globalStyles,
    css`
      .header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--color-primary-text-muted);
        text-decoration: none;
        font-size: var(--font-small);
        transition: var(--transition-fast);
      }

      .back-link:hover {
        color: var(--color-1);
      }

      .list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .search-filter {
        margin-bottom: 20px;
      }

      .empty {
        text-align: center;
        padding: 2rem;
        color: var(--color-primary-text-muted);
      }

      .count {
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
        margin-bottom: 16px;
      }
    `,
  ];

  override async load(): Promise<void> {
    await super.load();
    await this.loadCategory();
  }

  private async loadCategory(): Promise<void> {
    const path = window.location.pathname;
    const parts = path.split("/").filter(Boolean);
    this.categoryId = parts[0] ?? "";

    const cat = this.appContext?.categories?.find((c) => c.id === this.categoryId);
    this.categoryName = cat?.name ?? this.categoryId;

    try {
      const res = await fetch(`/content/${this.categoryId}/list.json`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      this.items = data
        .map((item: any) => ContentListItem.parse(item))
        .sort((a: import("../shared/type.content").ContentListItem, b: import("../shared/type.content").ContentListItem) => a.order - b.order);
      this.filteredItems = this.items;
    } catch {
      this.items = [];
      this.filteredItems = [];
    }
    this.loading = false;
  }

  override render(): TemplateResult {
    return html`
      <main>
        <a href="/" class="back-link">${leftArrowIcon} Home</a>
        <div class="header">
          <h1>${this.categoryName}</h1>
        </div>

        ${this.items.length > 5
          ? html`
              <div class="search-filter">
                <heroic-search-bar
                  placeholder="Filter ${this.categoryName.toLowerCase()}…"
                  @search-input=${this.handleFilter}></heroic-search-bar>
              </div>
            `
          : ""}

        <div class="count">${this.filteredItems.length} ${this.filteredItems.length === 1 ? "entry" : "entries"}</div>

        ${this.loading
          ? html`
              <div class="empty">Loading…</div>
            `
          : this.filteredItems.length === 0
            ? html`
                <div class="empty">No entries found.</div>
              `
            : html`
                <div class="list">
                  ${this.filteredItems.map(
                    (item) => html`
                      <heroic-entry-list-item
                        entryTitle=${item.title}
                        slug=${item.slug}
                        categoryId=${this.categoryId}
                        imageUrl=${item.heroImage?.url ?? ""}
                        imageAlt=${item.heroImage?.alt ?? item.title}></heroic-entry-list-item>
                    `,
                  )}
                </div>
              `}
      </main>
    `;
  }

  private handleFilter(e: CustomEvent): void {
    this.filterText = e.detail.value.toLowerCase();
    if (!this.filterText) {
      this.filteredItems = this.items;
    } else {
      this.filteredItems = this.items.filter((item) => item.title.toLowerCase().includes(this.filterText));
    }
  }
}
