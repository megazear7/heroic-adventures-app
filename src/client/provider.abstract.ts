import { LitElement } from "lit";

export abstract class HeroicAbstractProvider extends LitElement {
  abstract load(): Promise<void>;
}
