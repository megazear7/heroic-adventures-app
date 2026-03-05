# update-build-script Skill

**Purpose:**
Safely update or add build/test scripts in the `scripts/` directory.

**When to Use:**
- When automating new build steps or modifying existing ones.
- When adding new scripts for content, testing, or deployment.

**Instructions:**
1. Place scripts in `scripts/` and use `.ts` for TypeScript or `.js` for Node.js.
2. Use cross-platform Node.js APIs (avoid OS-specific commands).
3. Document script usage and environment variables at the top of the file.
4. Update `package.json` scripts section if adding new entry points.
5. Test scripts locally before committing.
6. Add or update smoke tests in `scripts/test.ts` if relevant.

**Code Example:**
```ts
// scripts/my-script.ts
/**
 * My script description.
 * Usage: npx tsx scripts/my-script.ts
 */
import { promises as fs } from "fs";
// ...script logic...
```

**Related Files:**
- `scripts/`
- `package.json`
