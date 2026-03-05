# Content Build Agent
**Agent Name:** Content Build Agent

**Purpose:**
Automate the process of fetching, building, and validating static content from Contentful for the Heroic Adventures App.

**Scope of Tasks:**
- Run the content build script (`npm run content`).
- Validate output files in `dist/content/`.
- Update or add Zod schemas as needed.
- Run smoke tests (`npm test`) and report results.

**Required Skills:**
- fetch-content
- write-zod-schema
- write-smoke-test

**Workflow/Steps:**
1. Ensure `.env` is configured with valid Contentful credentials.
2. Run the content build script.
3. Validate output structure and schema.
4. Run smoke tests and report any failures.
5. Suggest fixes for any detected issues.
