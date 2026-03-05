# Copilot Skills for Heroic Adventures App

This directory contains Copilot skills—reusable, task-focused instructions that teach Copilot how to perform specialized actions in this codebase. Each skill should be documented in its own file and referenced in prompts or agent configurations as needed.

## Example Skills

- **fetch-content**: How to fetch and build static content from Contentful using `scripts/fetch-content.ts`.
- **add-lit-component**: How to add a new Lit component to the UI, following project conventions.
- **add-shared-utility**: How to add a new utility or type to `src/shared/`.
- **update-build-script**: How to safely update or add build/test scripts in `scripts/`.
- **write-zod-schema**: How to define and use Zod schemas for data validation.
- **write-smoke-test**: How to add or update smoke tests for build and content validation.

## Skill Template

Each skill file should include:
- **Skill Name**
- **Purpose**
- **When to Use**
- **Step-by-Step Instructions**
- **Code Examples** (if relevant)

---
Add new skills as needed for recurring or complex tasks.
