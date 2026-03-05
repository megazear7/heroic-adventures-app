import { css, html, LitElement, PropertyValues, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { RouteConfig, RouteName } from "../shared/type.routes.js";
import { parseRouteParams } from "../shared/util.route-params.js";
import { routes } from "../shared/service.client.js";
import { ContentCategory } from "../shared/type.content.js";
import { ZeltTemplateAbstractProvider } from "./provider.abstract.js";
import { menuIcon } from "./icons.js";
import "./page.home.js";
import "./page.category.js";
import "./page.entry.js";
import "./page.search.js";
import "./page.not-found.js";
import "./component.nav-drawer.js";

@customElement("heroic-app")
export class HeroicApp extends LitElement {
  static override styles = [
    css`
      :host {
        display: block;
        min-height: 100vh;
      }

      .top-bar {
        position: sticky;
        top: 0;
        z-index: 999;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 20px;
        background: var(--color-primary-surface-raised);
        border-bottom: 1px solid rgba(201, 168, 76, 0.12);
        backdrop-filter: blur(10px);
      }

      .menu-btn {
        background: none;
        border: none;
        color: var(--color-primary-text-muted);
        cursor: pointer;
        padding: 4px;
        display: flex;
        transition: color var(--time-fast) ease;
      }

      .menu-btn:hover {
        color: var(--color-1);
      }

      .brand {
        font-family: var(--font-family-display);
        font-size: var(--font-medium);
        color: var(--color-1);
        text-decoration: none;
        letter-spacing: 0.04em;
        font-weight: 600;
      }

      .brand:hover {
        color: #d4b555;
      }

      .page-container {
        animation: fadeIn var(--time-normal) ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ];

  routes: RouteConfig[] = routes;

  @property({ type: String })
  currentRoute: RouteConfig | null = this.determineRouteName();

  @state() private drawerOpen = false;
  @state() private categories: ContentCategory[] = [];

  override async connectedCallback(): Promise<void> {
    super.connectedCallback();
    document.addEventListener("click", this.navigate.bind(this));
    window.addEventListener("popstate", () => {
      this.currentRoute = this.determineRouteName();
      this.requestUpdate();
    });

    // Load categories for the drawer
    try {
      const res = await fetch("/content/categories.json");
      this.categories = await res.json();
    } catch {
      this.categories = [];
    }
  }

  override render(): TemplateResult {
    const pageContent = this.renderPage();

    return html`
      <heroic-nav-drawer
        .open=${this.drawerOpen}
        .categories=${this.categories}
        @drawer-close=${() => (this.drawerOpen = false)}></heroic-nav-drawer>

      <div class="top-bar">
        <button class="menu-btn" @click=${() => (this.drawerOpen = true)}>${menuIcon}</button>
        <a href="/" class="brand">Heroic Adventures</a>
      </div>

      <div class="page-container" .key=${this.currentRoute?.name ?? "not-found"}>${pageContent}</div>
    `;
  }

  private renderPage(): TemplateResult {
    if (!this.currentRoute) {
      return html`
        <heroic-not-found-page></heroic-not-found-page>
      `;
    }

    switch (this.currentRoute.name) {
      case RouteName.enum.home:
        return html`
          <heroic-home-page></heroic-home-page>
        `;
      case RouteName.enum.search:
        return html`
          <heroic-search-page></heroic-search-page>
        `;
      case RouteName.enum.category:
        return html`
          <heroic-category-page></heroic-category-page>
        `;
      case RouteName.enum.entry:
        return html`
          <heroic-entry-page></heroic-entry-page>
        `;
      default:
        return html`
          <heroic-not-found-page></heroic-not-found-page>
        `;
    }
  }

  determineRouteName(): RouteConfig | null {
    const pathname = window.location.pathname;

    // Check search first (since /search would also match /:categoryId)
    if (pathname === "/search" || pathname.startsWith("/search?")) {
      return { name: RouteName.enum.search, path: "/search" };
    }

    for (const route of this.routes) {
      try {
        const params = parseRouteParams(route.path, pathname);
        if (params !== null) {
          return route;
        }
      } catch {
        // Continue to next route
      }
    }

    return null;
  }

  async navigate(event: Event): Promise<void> {
    let target: HTMLAnchorElement | null = null;
    for (const el of event.composedPath()) {
      if (el instanceof HTMLElement && el.tagName === "A") {
        target = el as HTMLAnchorElement;
        break;
      }
    }

    if (
      target &&
      target.href &&
      !target.hasAttribute("download") &&
      target.target !== "_blank" &&
      target.origin === window.location.origin
    ) {
      event.preventDefault();
      const url = new URL(target.href);
      window.history.pushState({}, "", url.pathname + url.search);
      this.currentRoute = this.determineRouteName();
      this.requestUpdate();
    }
  }

  protected override update(changedProperties: PropertyValues): void {
    super.update(changedProperties);
    if (this.currentRoute != null && changedProperties.has("currentRoute")) {
      const tagName = `heroic-${this.currentRoute.name.replace(/_/g, "-")}-page`;
      const pageElement = this.shadowRoot?.querySelector(tagName);
      const provider = pageElement as ZeltTemplateAbstractProvider;
      if (provider?.load) {
        provider.load().then(() => provider.requestUpdate());
      }
    }
  }
}
