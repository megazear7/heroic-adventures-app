# fetch-content Skill

**Purpose:**
Automate fetching and building static content from Contentful for the Heroic Adventures App.

**When to Use:**
- When updating or rebuilding the static content in `dist/content`.
- When Contentful data or schemas change.

**Instructions:**
1. Ensure `.env` is configured with valid Contentful credentials.
2. Run `npm run content` or `npx tsx scripts/fetch-content.ts`.
3. The script fetches all `ruleReference` entries and referenced assets.
4. Output is written to `dist/content/` as JSON and HTML files.
5. Validate output structure matches:
   - `dist/content/categories.json`
   - `dist/content/<category>/list.json`
   - `dist/content/<category>/<slug>/entry.json`
   - `dist/content/<category>/<slug>/content.html`
6. If adding new categories or fields, update mapping in `scripts/fetch-content.ts`.
7. Always run `npm test` after content build to verify integrity.

**Code Example:**
```sh
npm run content
npm test
```

**Related Files:**
- `scripts/fetch-content.ts`
- `.env.example`
- `README.md`
