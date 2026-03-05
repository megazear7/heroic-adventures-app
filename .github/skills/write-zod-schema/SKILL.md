# write-zod-schema Skill

**Purpose:**
Define and use Zod schemas for data validation throughout the codebase.

**When to Use:**
- When validating external data (e.g., Contentful API responses).
- When enforcing type safety for complex objects.

**Instructions:**
1. Import Zod: `import z from "zod";`
2. Define schemas for all external or complex data structures.
3. Use `.parse()` or `.safeParse()` to validate data at runtime.
4. Export schemas for reuse in other modules.
5. Add tests for custom validation logic if needed.

**Code Example:**
```ts
import z from "zod";

export const RuleReferenceSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
});

// Usage:
const rule = RuleReferenceSchema.parse(data);
```

**Related Files:**
- `src/shared/`
- `scripts/fetch-content.ts`
