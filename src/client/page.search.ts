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

      .results-summary {
        color: var(--color-primary-text-muted);
        font-size: var(--font-small);
        margin-bottom: 16px;
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

        <div class="results-summary">Fuzzy full-text search across rules, chapters, classes, spells, and items.</div>

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
}
