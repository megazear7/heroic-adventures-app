import { provide } from "@lit/context";
import { property } from "lit/decorators.js";
import { AppContext, appContext } from "./context.js";
import { LoadingStatus } from "../shared/type.loading.js";
import { ContentCategory } from "../shared/type.content.js";
import { HeroicAbstractProvider } from "./provider.abstract.js";

export abstract class HeroicAppProvider extends HeroicAbstractProvider {
  @provide({ context: appContext })
  @property({ attribute: false })
  appContext: AppContext = {
    status: LoadingStatus.enum.idle,
  };

  override async connectedCallback(): Promise<void> {
    super.connectedCallback();
    this.load();
  }

  async load(): Promise<void> {
    try {
      const res = await fetch("/content/categories.json");
      const data = await res.json();
      const categories = data.map((c: any) => ContentCategory.parse(c)); // eslint-disable-line @typescript-eslint/no-explicit-any
      this.appContext = {
        categories,
        status: LoadingStatus.enum.success,
      };
    } catch (err) {
      this.appContext = {
        status: LoadingStatus.enum.error,
        error: String(err),
      };
    }
  }
}
