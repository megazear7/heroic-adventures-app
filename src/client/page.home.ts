import { css, html, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { consume } from "@lit/context";
import { property } from "lit/decorators.js";
import { globalStyles } from "./styles.global.js";
import { HeroicAppProvider } from "./provider.app.js";
import { AppContext, appContext } from "./context.js";
import { ContentCategory } from "../shared/type.content.js";
import "../client/component.category-card.js";
import "../client/component.search-bar.js";

@customElement("heroic-home-page")
export class HeroicHomePage extends HeroicAppProvider {
  @consume({ context: appContext, subscribe: true })
  @property({ attribute: false })
  override appContext!: AppContext;

  static override styles = [
    globalStyles,
    css`
      .hero {
        text-align: center;
        padding: 16px 20px 32px;
      }

      .hero h1 {
        font-size: 36px;
        letter-spacing: 0.04em;
        margin-bottom: 12px;
      }

      .hero p {
        color: var(--color-primary-text-muted);
        max-width: 600px;
        margin: 0 auto 32px;
      }

      .search-section {
        max-width: 500px;
        margin: 0 auto 40px;
      }

      .section-title {
        font-family: var(--font-family-display);
        font-size: var(--font-large);
        color: var(--color-1);
        margin: 0 0 16px 0;
        padding-left: 20px;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 12px;
        padding: 0 20px;
        max-width: var(--content-width);
        margin: 0 auto 32px;
      }

      .section-divider {
        border: none;
        border-top: 1px solid rgba(201, 168, 76, 0.1);
        margin: 16px 20px;
        max-width: var(--content-width);
      }
    `,
  ];

  override render(): TemplateResult {
    const categories: ContentCategory[] = this.appContext?.categories ?? [];
    const core = categories.filter((c) => !c.category.startsWith("spell") && !c.category.startsWith("item") && !c.category.startsWith("agent >"));
    const spells = categories.filter((c) => c.category.startsWith("spell"));
    const items = categories.filter((c) => c.category.startsWith("item"));
    const ai = categories.filter((c) => c.category.startsWith("agent >"));

    return html`
      <main>
        <div class="hero">
          <img src="/logo/logo-512x512.png" alt="Heroic Adventures Logo" width="128" height="128" style="margin-bottom: 16px;" />
          <h1>Heroic Adventures</h1>
          <p>
            Your companion for Heroic Adventures 2nd Edition. Browse chapters, rules, classes, spells, items, and more.
          </p>
          <div style="margin-top: 18px;">
            <small style="color: var(--color-primary-text-muted); font-size: 15px;">
              Want to connect your AI to Heroic Adventures? Take a look at the <a href="https://mcp.heroicadventures.app/" target="_blank" rel="noopener">Heroic Adventures MCP</a>.
            </small>
          </div>
        </div>

        <div class="search-section">
          <heroic-search-bar
            placeholder="Search rules, spells, items…"
            @search-submit=${this.handleSearch}></heroic-search-bar>
        </div>

        ${core.length
          ? html`
              <h2 class="section-title">Core Rules</h2>
              <div class="grid">
                ${core.map(
                  (c) => html`
                    <heroic-category-card categoryId=${c.id} name=${c.name} .count=${c.count}></heroic-category-card>
                  `,
                )}
              </div>
            `
          : ""}
        ${spells.length
          ? html`
              <hr class="section-divider" />
              <h2 class="section-title">Spells</h2>
              <div class="grid">
                ${spells.map(
                  (c) => html`
                    <heroic-category-card categoryId=${c.id} name=${c.name} .count=${c.count}></heroic-category-card>
                  `,
                )}
              </div>
            `
          : ""}
        ${items.length
          ? html`
              <hr class="section-divider" />
              <h2 class="section-title">Equipment &amp; Items</h2>
              <div class="grid">
                ${items.map(
                  (c) => html`
                    <heroic-category-card categoryId=${c.id} name=${c.name} .count=${c.count}></heroic-category-card>
                  `,
                )}
              </div>
            `
          : ""}
        ${ai.length
          ? html`
              <hr class="section-divider" />
              <h2 class="section-title">AI</h2>
              <div class="grid">
                ${ai.map(
                  (c) => html`
                    <heroic-category-card categoryId=${c.id} name=${c.name} .count=${c.count}></heroic-category-card>
                  `,
                )}
              </div>
            `
          : ""}
      </main>
    `;
  }

  private handleSearch(e: CustomEvent): void {
    const query = e.detail.value;
    if (query) {
      window.history.pushState({}, "", `/search?q=${encodeURIComponent(query)}`);
      this.dispatchEvent(
        new CustomEvent("NavigationEvent", {
          bubbles: true,
          composed: true,
          detail: { path: `/search?q=${encodeURIComponent(query)}` },
        }),
      );
    }
  }
}
