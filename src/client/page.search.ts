import { css, html, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import { globalStyles } from "./styles.global.js";
import { HeroicAppProvider } from "./provider.app.js";
import { AppContext, appContext } from "./context.js";
import { ContentCategory, ContentListItem } from "../shared/type.content.js";
import { leftArrowIcon } from "./icons.js";
import "./component.search-bar.js";
import "./component.entry-list-item.js";

interface SearchResult extends ContentListItem {
  categoryId: string;
  categoryName: string;
}

@customElement("heroic-search-page")
export class HeroicSearchPage extends HeroicAppProvider {
  @consume({ context: appContext, subscribe: true })
  @property({ attribute: false })
  override appContext!: AppContext;

  @state() private query = "";
  @state() private results: SearchResult[] = [];
  @state() private loading = false;
  @state() private hasSearched = false;
  private allEntries: SearchResult[] = [];
  private loaded = false;

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

      .search-section {
        margin-bottom: 24px;
      }

      .results-info {
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

      .category-badge {
        display: inline-block;
        font-size: var(--font-tiny);
        color: var(--color-1);
        background: rgba(201, 168, 76, 0.1);
        padding: 2px 8px;
        border-radius: 10px;
        margin-left: 8px;
      }
    `,
  ];

  override async load(): Promise<void> {
    await super.load();

    const params = new URLSearchParams(window.location.search);
    this.query = params.get("q") ?? "";

    if (!this.loaded) {
      await this.loadAllEntries();
    }

    if (this.query) {
      this.search(this.query);
    }
  }

  private async loadAllEntries(): Promise<void> {
    this.loading = true;
    const categories: ContentCategory[] = this.appContext?.categories ?? [];
    const allEntries: SearchResult[] = [];

    const fetches = categories.map(async (cat) => {
      try {
        const res = await fetch(`/content/${cat.id}/list.json`);
        if (!res.ok) return;
        const items = await res.json();
        for (const item of items) {
          allEntries.push({
            ...ContentListItem.parse(item),
            categoryId: cat.id,
            categoryName: cat.name,
          });
        }
      } catch {
        // skip category
      }
    });

    await Promise.all(fetches);
    this.allEntries = allEntries;
    this.loaded = true;
    this.loading = false;
  }

  private search(query: string): void {
    this.hasSearched = true;
    const q = query.toLowerCase().trim();
    if (!q) {
      this.results = [];
      return;
    }
    this.results = this.allEntries
      .filter((e) => e.title.toLowerCase().includes(q))
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  override render(): TemplateResult {
    return html`
      <main>
        <a href="/" class="back-link">${leftArrowIcon} Home</a>
        <h1>Search</h1>

        <div class="search-section">
          <heroic-search-bar
            .value=${this.query}
            placeholder="Search all content…"
            @search-input=${this.handleInput}
            @search-submit=${this.handleSubmit}></heroic-search-bar>
        </div>

        ${this.loading
          ? html`
              <div class="empty">Loading content index…</div>
            `
          : this.hasSearched
            ? html`
                <div class="results-info">
                  ${this.results.length} result${this.results.length !== 1 ? "s" : ""}
                  ${this.query
                    ? html`
                        for "
                        <strong>${this.query}</strong>
                        "
                      `
                    : ""}
                </div>
                ${this.results.length === 0
                  ? html`
                      <div class="empty">No results found. Try a different search term.</div>
                    `
                  : html`
                      <div class="list">
                        ${this.results.map(
                          (item) => html`
                            <heroic-entry-list-item
                              entryTitle="${item.title}"
                              slug=${item.slug}
                              categoryId=${item.categoryId}
                              imageUrl=${item.heroImage?.url ?? ""}
                              imageAlt=${item.heroImage?.alt ?? item.title}></heroic-entry-list-item>
                          `,
                        )}
                      </div>
                    `}
              `
            : html`
                <div class="empty">Type a search term to find rules, spells, items, and more.</div>
              `}
      </main>
    `;
  }

  private handleInput(e: CustomEvent): void {
    this.query = e.detail.value;
    this.search(this.query);
  }

  private handleSubmit(e: CustomEvent): void {
    this.query = e.detail.value;
    this.search(this.query);
    const url = this.query ? `/search?q=${encodeURIComponent(this.query)}` : "/search";
    window.history.replaceState({}, "", url);
  }
}
