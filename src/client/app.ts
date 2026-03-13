import { css, html, LitElement, PropertyValues, TemplateResult, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { RouteConfig, RouteName } from "../shared/type.routes.js";
import { parseRouteParams } from "../shared/util.route-params.js";
import { routes } from "../shared/service.client.js";
import { ContentCategory } from "../shared/type.content.js";
import { HeroicAbstractProvider } from "./provider.abstract.js";
import { menuIcon, wifiOffIcon } from "./icons.js";
import { getActiveProfile, PROFILE_CHANGED_EVENT, UserProfile } from "../shared/service.profile.js";
import "./page.home.js";
import "./page.category.js";
import "./page.entry.js";
import "./page.search.js";
import "./page.favorites.js";
import "./page.recent.js";
import "./page.settings.js";
import "./page.not-found.js";
import "./component.nav-drawer.js";
import "./component.bookmark-bar.js";
import "./component.profile-modal.js";
import "./component.profile-menu.js";

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

      .offline-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-left: auto;
        padding: 4px 10px;
        border-radius: 12px;
        background: rgba(201, 168, 76, 0.15);
        color: var(--color-primary-text-muted);
        font-size: 0.75rem;
        font-weight: 500;
        letter-spacing: 0.03em;
        opacity: 0;
        transform: translateY(-4px);
        transition:
          opacity var(--time-normal) ease,
          transform var(--time-normal) ease;
      }

      .offline-badge.visible {
        opacity: 1;
        transform: translateY(0);
      }

      .page-container {
        animation: fadeIn var(--time-normal) ease;
        padding-bottom: 72px;
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
  @state() private isOffline = !navigator.onLine;
  @state() private activeProfile: UserProfile | null = getActiveProfile();
  @state() private showProfileModal = false;
  @state() private showProfileModalExisting = false;
  override async connectedCallback(): Promise<void> {
    super.connectedCallback();
    document.addEventListener("click", this.navigate.bind(this));
    this.addEventListener("NavigationEvent", (e: Event) => this.handleNavigationEvent(e as CustomEvent));
    window.addEventListener("popstate", () => {
      this.currentRoute = this.determineRouteName();
      this.requestUpdate();
    });

    window.addEventListener("online", () => (this.isOffline = false));
    window.addEventListener("offline", () => (this.isOffline = true));

    // Show welcome modal if no profile exists
    if (!this.activeProfile) {
      this.showProfileModal = true;
      this.showProfileModalExisting = false;
    }

    // Listen for profile changes
    window.addEventListener(PROFILE_CHANGED_EVENT, () => {
      this.activeProfile = getActiveProfile();
    });

    // Listen for switch-profile request from the menu
    this.addEventListener("profile-switch-request", () => {
      this.showProfileModal = true;
      this.showProfileModalExisting = true;
    });

    // Listen for profile modal events
    this.addEventListener("profile-created", () => {
      this.activeProfile = getActiveProfile();
      this.showProfileModal = false;
      this.requestUpdate();
    });
    this.addEventListener("profile-switched", () => {
      this.activeProfile = getActiveProfile();
      this.showProfileModal = false;
      this.requestUpdate();
    });
    this.addEventListener("profile-modal-close", () => {
      // Only allow closing if a profile exists
      if (this.activeProfile) {
        this.showProfileModal = false;
      }
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
        <span class="offline-badge ${this.isOffline ? "visible" : ""}">${wifiOffIcon} Offline</span>
        ${this.activeProfile ? html`<heroic-profile-menu .profile=${this.activeProfile}></heroic-profile-menu>` : nothing}
      </div>

      <heroic-profile-modal
        .open=${this.showProfileModal}
        .showExisting=${this.showProfileModalExisting}></heroic-profile-modal>

      <div class="page-container" .key=${this.currentRoute?.name ?? "not-found"}>${pageContent}</div>

      <heroic-bookmark-bar></heroic-bookmark-bar>
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
      case RouteName.enum.favorites:
        return html`
          <heroic-favorites-page></heroic-favorites-page>
        `;
      case RouteName.enum.recent:
        return html`
          <heroic-recent-page></heroic-recent-page>
        `;
      case RouteName.enum.category:
        return html`
          <heroic-category-page></heroic-category-page>
        `;
      case RouteName.enum.entry:
        return html`
          <heroic-entry-page></heroic-entry-page>
        `;
      case RouteName.enum.settings:
        return html`
          <heroic-settings-page></heroic-settings-page>
        `;
      default:
        return html`
          <heroic-not-found-page></heroic-not-found-page>
        `;
    }
  }

  determineRouteName(): RouteConfig | null {
    const pathname = window.location.pathname;

    // Check search/favorites/recent first (since they would also match /:categoryId)
    if (pathname === "/search" || pathname.startsWith("/search?")) {
      return { name: RouteName.enum.search, path: "/search" };
    }
    if (pathname === "/favorites") {
      return { name: RouteName.enum.favorites, path: "/favorites" };
    }
    if (pathname === "/recent") {
      return { name: RouteName.enum.recent, path: "/recent" };
    }
    if (pathname === "/settings") {
      return { name: RouteName.enum.settings, path: "/settings" };
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

  async handleNavigationEvent(event: CustomEvent): Promise<void> {
    const path: string = event.detail?.path;
    if (!path) return;

    const url = new URL(path, window.location.origin);
    const previousPath = window.location.pathname;
    window.history.pushState({}, "", url.pathname + url.search);
    this.currentRoute = this.determineRouteName();
    this.requestUpdate();

    if (url.pathname !== previousPath && this.currentRoute) {
      await this.updateComplete;
      const tagName = `heroic-${this.currentRoute.name.replace(/_/g, "-")}-page`;
      const pageElement = this.shadowRoot?.querySelector(tagName);
      const provider = pageElement as HeroicAbstractProvider;
      if (provider?.load) {
        provider.load().then(() => provider.requestUpdate());
      }
    }
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
      const previousPath = window.location.pathname;
      window.history.pushState({}, "", url.pathname + url.search);
      this.currentRoute = this.determineRouteName();
      this.requestUpdate();

      // When navigating within the same route type (e.g. entry → entry),
      // changedProperties won't include currentRoute, so manually reload.
      if (url.pathname !== previousPath && this.currentRoute) {
        await this.updateComplete;
        const tagName = `heroic-${this.currentRoute.name.replace(/_/g, "-")}-page`;
        const pageElement = this.shadowRoot?.querySelector(tagName);
        const provider = pageElement as HeroicAbstractProvider;
        if (provider?.load) {
          provider.load().then(() => provider.requestUpdate());
        }
      }
    }
  }

  protected override update(changedProperties: PropertyValues): void {
    super.update(changedProperties);
    if (this.currentRoute != null && changedProperties.has("currentRoute")) {
      const tagName = `heroic-${this.currentRoute.name.replace(/_/g, "-")}-page`;
      const pageElement = this.shadowRoot?.querySelector(tagName);
      const provider = pageElement as HeroicAbstractProvider;
      if (provider?.load) {
        provider.load().then(() => provider.requestUpdate());
      }
    }
  }
}
