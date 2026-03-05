import { LitElement } from "lit";

export abstract class ZeltTemplateAbstractProvider extends LitElement {
  abstract load(): Promise<void>;
}
