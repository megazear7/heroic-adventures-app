# add-shared-utility Skill

**Purpose:**
Add a new utility function or type to the shared codebase, following project conventions.

**When to Use:**
- When creating reusable logic, helpers, or type definitions.
- When refactoring code to reduce duplication.

**Instructions:**
1. Place new utilities or types in `src/shared/`.
2. Use descriptive, kebab-case filenames (e.g., `util.time.ts`).
3. Export all functions/types for easy import.
4. Write clear JSDoc comments for each exported item.
5. Add tests or usage examples if the utility is non-trivial.

**Code Example:**
```ts
// src/shared/util.time.ts
/**
 * Returns the current time in ISO format.
 */
export function getCurrentIsoTime(): string {
  return new Date().toISOString();
}
```

**Related Files:**
- `src/shared/`
