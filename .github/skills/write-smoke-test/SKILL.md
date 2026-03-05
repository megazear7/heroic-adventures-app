# write-smoke-test Skill

**Purpose:**
Add or update smoke tests to validate build and content integrity.

**When to Use:**
- When changing build scripts, content structure, or adding new features.
- When fixing bugs related to build or content output.

**Instructions:**
1. Place smoke tests in `scripts/test.ts`.
2. Use Node.js and TypeScript for test scripts.
3. Test for existence and validity of key output files (e.g., `dist/content/categories.json`).
4. Validate JSON structure and required fields.
5. Print clear error messages and exit with non-zero code on failure.
6. Run `npm test` to execute all smoke tests.

**Code Example:**
```ts
// scripts/test.ts
import { promises as fs } from "fs";
async function main() {
  const categories = JSON.parse(await fs.readFile("dist/content/categories.json", "utf8"));
  if (!Array.isArray(categories)) throw new Error("categories.json is not an array");
  // ...more checks...
}
main().catch(e => { console.error(e); process.exit(1); });
```

**Related Files:**
- `scripts/test.ts`
- `dist/content/`
