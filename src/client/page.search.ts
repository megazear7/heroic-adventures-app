import { css, html, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import { globalStyles } from "./styles.global.js";
import { HeroicAppProvider } from "./provider.app.js";
import { AppContext, appContext } from "./context.js";
import { leftArrowIcon } from "./icons.js";
import { loadSearchIndex, scoreSearchEntry, SearchIndexedEntry } from "./service.search.js";
import { SearchSuggestion } from "./component.search-bar.js";
import "./component.search-bar.js";
import "./component.entry-list-item.js";

interface SearchResult extends SearchIndexedEntry {
  score: number;
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
  @state() private suggestions: SearchSuggestion[] = [];
  @state() private sidebarOpen = false;

  private loadedSearchIndex: SearchIndexedEntry[] = [];
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
        margin-bottom: 16px;
      }

      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .sidebar-toggle {
        border: 1px solid rgba(201, 168, 76, 0.3);
        background: rgba(201, 168, 76, 0.1);
        color: var(--color-primary-text);
        border-radius: var(--border-radius-small);
        padding: 8px 12px;
        font-size: var(--font-small);
        cursor: pointer;
      }

      .layout {
        display: grid;
        grid-template-columns: minmax(220px, 280px) 1fr;
        gap: 20px;
      }

      .sidebar {
        background: var(--color-primary-surface-raised);
        border: var(--border-normal);
        border-radius: var(--border-radius-medium);
        padding: 16px;
        max-height: calc(100vh - 170px);
        overflow: auto;
        position: sticky;
        top: 86px;
      }

      .sidebar h3 {
        margin: 0 0 8px 0;
        color: var(--color-1);
        font-size: var(--font-small);
      }

      .sidebar p {
        margin: 0 0 12px 0;
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
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

      .results {
        min-width: 0;
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

      @media (max-width: 900px) {
        .layout {
          grid-template-columns: 1fr;
        }

        .sidebar {
          position: static;
          max-height: none;
          display: none;
        }

        .sidebar.open {
          display: block;
        }
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
    this.loadedSearchIndex = await loadSearchIndex();
    this.loaded = true;
    this.loading = false;
  }

  private search(query: string): void {
    this.hasSearched = true;
    const q = query.trim();
    if (!q) {
      this.results = [];
      this.suggestions = [];
      return;
    }

    this.results = this.loadedSearchIndex
      .map((entry) => ({ ...entry, score: scoreSearchEntry(q, entry) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.order - b.order)
      .slice(0, 250);

    this.suggestions = this.results.slice(0, 6).map((item) => ({
      title: item.title,
      href: `/${item.categoryId}/${item.slug}`,
      imageUrl: item.heroImage?.url,
      imageAlt: item.heroImage?.alt,
      categoryName: item.categoryName,
      subcategoryName: item.subcategory ?? undefined,
    }));
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
            .suggestions=${this.suggestions}
            @search-input=${this.handleInput}
            @search-submit=${this.handleSubmit}
            @search-navigate=${this.handleSearchNavigate}></heroic-search-bar>
        </div>

        <div class="toolbar">
          <div class="results-info">Fuzzy full-text search across rules, chapters, classes, spells, and items.</div>
          <button class="sidebar-toggle" @click=${this.toggleSidebar}>Search Tips</button>
        </div>

        ${this.loading
          ? html`
              <div class="empty">Loading content index…</div>
            `
          : this.hasSearched
            ? html`
                <div class="layout">
                  <aside class="sidebar ${this.sidebarOpen ? "open" : ""}">
                    <h3>Search Tips</h3>
                    <p>Try short keywords, full titles, or misspelled names for fuzzy matches.</p>
                    <p>Use this for quick rule lookups across all indexed content.</p>
                  </aside>

                  <section class="results">
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
                          <div class="empty">No results found. Try a different query.</div>
                        `
                      : html`
                          <div class="list">
                            ${this.results.map(
                              (item) => html`
                                <heroic-entry-list-item
                                  entryTitle="${item.title}"
                                  slug=${item.slug}
                                  categoryId=${item.categoryId}
                                  categoryName=${item.categoryName}
                                  subcategoryName=${item.subcategory ?? ""}
                                  imageUrl=${item.heroImage?.url ?? ""}
                                  imageAlt=${item.heroImage?.alt ?? item.title}></heroic-entry-list-item>
                              `,
                            )}
                          </div>
                        `}
                  </section>
                </div>
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

  private handleSearchNavigate(e: CustomEvent): void {
    const href: string = e.detail.href;
    if (!href) return;
    window.history.pushState({}, "", href);
    this.dispatchEvent(
      new CustomEvent("NavigationEvent", {
        bubbles: true,
        composed: true,
        detail: { path: href },
      }),
    );
  }

  private toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
