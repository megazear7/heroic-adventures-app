import { html, LitElement, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { upsertEncounter } from "../../shared/service.encounters.js";
import { Encounter } from "../../shared/type.encounter.js";
import { shuffleDeck } from "../../shared/util.encounter.js";

function newEncounter(): Encounter {
  return {
    id: crypto.randomUUID(),
    name: "New Encounter",
    level: 1,
    round: 1,
    currentCardIndex: -1,
    deck: shuffleDeck(),
    participants: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

@customElement("page-encounter-create")
export class PageEncounterCreate extends LitElement {
  override connectedCallback(): void {
    super.connectedCallback();
    const encounter = newEncounter();
    upsertEncounter(encounter);
    this.dispatchEvent(
      new CustomEvent("NavigationEvent", {
        detail: { path: `/encounter/${encounter.id}` },
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render(): TemplateResult {
    return html``;
  }
}
