import { css, html, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import { globalStyles } from "./styles.global.js";
import { HeroicAppProvider } from "./provider.app.js";
import { AppContext, appContext } from "./context.js";
import { leftArrowIcon } from "./icons.js";
import {
  buildFilterOptions,
  loadSearchIndex,
  matchesFilters,
  scoreSearchEntry,
  SearchFilters,
  SearchIndexedEntry,
} from "./service.search.js";
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
  @state() private availableLevels: number[] = [];
  @state() private availableClasses: string[] = [];
  @state() private availableTags: string[] = [];
  @state() private selectedLevels = new Set<number>();
  @state() private selectedClasses = new Set<string>();
  @state() private selectedTags = new Set<string>();
  @state() private filtersOpen = false;

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

      .filter-toggle {
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

      .filters {
        background: var(--color-primary-surface-raised);
        border: var(--border-normal);
        border-radius: var(--border-radius-medium);
        padding: 16px;
        max-height: calc(100vh - 170px);
        overflow: auto;
        position: sticky;
        top: 86px;
      }

      .filter-group + .filter-group {
        margin-top: 16px;
      }

      .filter-group h3 {
        margin: 0 0 10px;
        font-size: var(--font-small);
        color: var(--color-1);
      }

      .filter-option {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        margin-bottom: 6px;
        text-transform: capitalize;
      }

      .filter-option input {
        margin: 0;
      }

      .clear-filters {
        margin-top: 10px;
        border: none;
        background: none;
        color: var(--color-primary-text-muted);
        cursor: pointer;
        padding: 0;
        font-size: 0.8rem;
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

        .filters {
          position: static;
          max-height: none;
          display: none;
        }

        .filters.open {
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
    const options = buildFilterOptions(this.loadedSearchIndex);
    this.availableLevels = options.levels;
    this.availableClasses = options.classes;
    this.availableTags = options.tags;
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

    const filters: SearchFilters = {
      levels: this.selectedLevels,
      classes: this.selectedClasses,
      tags: this.selectedTags,
    };

    this.results = this.loadedSearchIndex
      .filter((entry) => matchesFilters(entry, filters))
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
    const selectedFilterCount = this.selectedLevels.size + this.selectedClasses.size + this.selectedTags.size;

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
          <button class="filter-toggle" @click=${this.toggleFilters}>
            Filters${selectedFilterCount > 0 ? ` (${selectedFilterCount})` : ""}
          </button>
        </div>

        ${this.loading
          ? html`
              <div class="empty">Loading content index…</div>
            `
          : this.hasSearched
            ? html`
                <div class="layout">
                  <aside class="filters ${this.filtersOpen ? "open" : ""}">
                    ${this.renderFilterSection(
                      "Level",
                      this.availableLevels.map((level) => String(level)),
                      this.selectedLevels,
                      (value) => Number(value),
                      (value) => this.toggleLevel(value as number),
                    )}
                    ${this.renderFilterSection(
                      "Class",
                      this.availableClasses,
                      this.selectedClasses,
                      (value) => value,
                      (value) => this.toggleClass(value as string),
                    )}
                    ${this.renderFilterSection(
                      "Tags",
                      this.availableTags,
                      this.selectedTags,
                      (value) => value,
                      (value) => this.toggleTag(value as string),
                    )}
                    ${selectedFilterCount > 0
                      ? html`
                          <button class="clear-filters" @click=${this.clearFilters}>Clear all filters</button>
                        `
                      : ""}
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
                          <div class="empty">No results found. Try a different query or adjust filters.</div>
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

  private toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
  }

  private clearFilters(): void {
    this.selectedLevels = new Set();
    this.selectedClasses = new Set();
    this.selectedTags = new Set();
    this.search(this.query);
  }

  private toggleLevel(value: number): void {
    const updated = new Set(this.selectedLevels);
    if (updated.has(value)) {
      updated.delete(value);
    } else {
      updated.add(value);
    }
    this.selectedLevels = updated;
    this.search(this.query);
  }

  private toggleClass(value: string): void {
    const updated = new Set(this.selectedClasses);
    if (updated.has(value)) {
      updated.delete(value);
    } else {
      updated.add(value);
    }
    this.selectedClasses = updated;
    this.search(this.query);
  }

  private toggleTag(value: string): void {
    const updated = new Set(this.selectedTags);
    if (updated.has(value)) {
      updated.delete(value);
    } else {
      updated.add(value);
    }
    this.selectedTags = updated;
    this.search(this.query);
  }

  private renderFilterSection<T extends string | number>(
    title: string,
    options: string[],
    selected: Set<T>,
    transform: (value: string) => T,
    onToggle: (value: T) => void,
  ): TemplateResult {
    if (options.length === 0) {
      return html``;
    }

    return html`
      <section class="filter-group">
        <h3>${title}</h3>
        ${options.map((option) => {
          const transformed = transform(option);
          return html`
            <label class="filter-option">
              <input type="checkbox" .checked=${selected.has(transformed)} @change=${() => onToggle(transformed)} />
              <span>${option}</span>
            </label>
          `;
        })}
      </section>
    `;
  }
}
