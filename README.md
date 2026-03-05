# Heroic Adventures App

Heroic Adventures App is a **client-only static web app** for browsing Heroic Adventures 2nd Edition content (chapters, rules, races, classes, feats, spells, items, and more).

It uses the Zelt stack style (Zod + Lit + TypeScript) and pulls published content from Contentful Content Delivery API.

## Requirements

- Node.js 22 (`.nvmrc`)
- npm
- Contentful Content Delivery API token with access to your target space/environment

## Quick Start

```sh
nvm use 22
npm install
cp .env.example .env
```

Edit `.env` and set:

```dotenv
CONTENTFUL_DELIVERY_TOKEN=...
CONTENTFUL_SPACE_ID=1xrzrik78qmb
CONTENTFUL_ENVIRONMENT_ID=master
```

Then run:

```sh
npm run content
npm start
```

Open http://localhost:3000.

## How It Works

### 1) Content Build (`npm run content`)

The script in `scripts/fetch-content.ts`:

- fetches published `ruleReference` entries from Contentful
- fetches referenced assets
- renders rich text to HTML
- writes static content artifacts under `dist/content`

Output layout:

- `dist/content/categories.json`
- `dist/content/<category>/list.json`
- `dist/content/<category>/<slug>/entry.json`
- `dist/content/<category>/<slug>/content.html`

### 2) App Build (`npm run build`)

Rollup compiles the Lit client and copies static assets into `dist/`:

- `dist/index.html`
- `dist/bundle.js`
- `dist/app.css`
- `dist/logo/*`, `dist/manifest.json`, and other static files

### 3) Local Serve (`npm start`)

Runs a static server (`serve`) and Rollup watch mode for fast local iteration.

## Scripts

- `npm run content` — Build `dist/content` from Contentful
- `npm run build` — TypeScript + Rollup production build
- `npm start` — Build then run local static server + watch mode
- `npm run serve` — Serve static output + watch mode (expects built files)
- `npm test` — Smoke tests for build and generated content
- `npm run lint` — Prettier + ESLint checks
- `npm run fix` — Auto-fix formatting and lint issues

## Project Structure

```
src/
   client/     Lit components and pages
   shared/     shared route/types utilities
   static/     static entrypoint and assets
scripts/
   fetch-content.ts
   test.ts
dist/
   index.html
   bundle.js
   content/
```

## Deployment

Deploy the contents of `dist/` to any static host (Netlify, Vercel static output, Cloudflare Pages, S3+CloudFront, etc).

Recommended deployment flow:

1. `npm ci`
2. `npm run content`
3. `npm run build`
4. publish `dist/`

## Troubleshooting

- **`0 entries fetched` during `npm run content`**
   - Your delivery token is valid, but entries may not be published yet in Contentful.
- **`AccessTokenInvalid`**
   - Verify `CONTENTFUL_DELIVERY_TOKEN` and confirm it belongs to the expected space.
- **Missing category `list.json` in tests**
   - Categories with zero published entries won’t have generated per-category content.

## License

ISC
