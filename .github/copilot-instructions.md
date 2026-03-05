# Copilot Instructions for Heroic Adventures App

This file provides project-wide Copilot instructions to ensure AI-generated code and agent actions align with the architecture, conventions, and goals of the Heroic Adventures App.

## Project Overview
- **Heroic Adventures App** is a static web app for browsing Heroic Adventures 2nd Edition content (rules, chapters, classes, spells, items, etc.).
- Built with the Zelt stack: Zod + Lit + TypeScript.
- Content is fetched from Contentful and built into static JSON/HTML artifacts in `dist/content`.
- The app is client-only, with no backend server.

## Coding Conventions
- Use TypeScript strict mode.
- Use Lit for all UI components and pages.
- Organize code by feature: `src/client/` for UI, `src/shared/` for utilities/types, `scripts/` for build/test scripts.
- Prefer functional, composable utilities.
- Use Zod for schema validation.
- Follow Prettier and ESLint rules (see `.prettierrc.json` and `eslint.config.js`).

## Best Practices
- Keep components small and focused.
- Use semantic HTML and accessible ARIA attributes.
- Write clear, concise comments for complex logic.
- Validate all external data with Zod schemas.
- Avoid direct DOM manipulation—use Lit's reactive model.
- Prefer async/await for asynchronous code.
- Write scripts to be idempotent and safe to re-run.

## Copilot Agent Guidance
- When asked to add features, follow the existing file/folder structure and naming conventions.
- When generating new components, place them in `src/client/` and use Lit patterns.
- When adding types or utilities, use `src/shared/`.
- When updating build/test scripts, use `scripts/` and keep them cross-platform.
- Always update or add tests when changing build logic.
- Use clear, descriptive commit messages.

## Documentation
- Update `README.md` if project setup, build, or usage changes.
- Document new scripts and utilities inline and in the README if user-facing.

## Testing
- Use `npm test` for smoke tests.
- Ensure all builds pass before pushing changes.

## Security
- Never commit secrets or credentials.
- Validate all user and external input.

---
For more details, see the project README and code comments.

