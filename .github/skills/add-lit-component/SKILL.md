# add-lit-component Skill

**Purpose:**
Add a new Lit component to the UI, following project conventions for structure, naming, and style.

**When to Use:**
- When implementing a new UI feature or reusable widget.
- When refactoring or splitting existing components.

**Instructions:**
1. Place new components in `src/client/`.
2. Use the `@customElement` decorator and extend `LitElement` or project base classes.
3. Use TypeScript strict mode and type all properties.
4. Style with Lit's `css` template and reference `styles.global.ts` for shared styles.
5. Register the component in the relevant page or parent component.
6. Write clear JSDoc comments for public properties and methods.
7. Add tests or usage examples if the component is complex.

**Code Example:**
```ts
import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("my-widget")
export class MyWidget extends LitElement {
  @property({ type: String }) label = "";
  static styles = css`
    /* styles here */
  `;
  render() {
    return html`<div>${this.label}</div>`;
  }
}
```

**Related Files:**
- `src/client/`
- `src/client/styles.global.ts`
