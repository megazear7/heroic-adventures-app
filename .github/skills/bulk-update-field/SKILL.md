# Skill: Bulk Update Contentful Field

## Overview
This skill explains how to use the `scripts/bulk-update-field.js` script to bulk update a field value for entries in Contentful, including publishing changes. It supports dry-run mode for safe testing.

## Prerequisites
- Node.js 18+ (for global fetch)
- Environment variables set (or .env file):
  - `CONTENTFUL_MANAGEMENT_TOKEN` (API token)
  - `CONTENTFUL_SPACE_ID` (space ID)
  - Optionally: `CONTENTFUL_ENV_ID` (defaults to `master`)
- The script file: `scripts/bulk-update-field.js`

## Usage
Run the script from the project root:

```
node scripts/bulk-update-field.js <contentType> <fieldName> <oldValue> <newValue> [--dry]
```

- `<contentType>`: Contentful content type ID (e.g. `ruleReference`)
- `<fieldName>`: Field to update (e.g. `category`)
- `<oldValue>`: Current value to match (e.g. `skill`)
- `<newValue>`: New value to set (e.g. `agent > skill`)
- `--dry`: Optional. If provided, the script logs actions but does not update or publish entries.

### Example
To update all `ruleReference` entries with category `skill` to `agent > skill`:

```
node scripts/bulk-update-field.js ruleReference category skill "agent > skill"
```

To simulate the update without making changes:

```
node scripts/bulk-update-field.js ruleReference category skill "agent > skill" --dry
```

## Features
- Paginates through all matching entries
- Logs each entry and action
- Publishes after update
- Supports dry-run for safe testing

## Troubleshooting
- Ensure environment variables are set or .env file exists
- Check field/value spelling and case
- Review logs for errors or skipped entries

## When to Use
- Bulk updating field values across many Contentful entries
- Migrating categories, tags, or other metadata
- Testing updates safely with dry-run

---
For advanced usage or troubleshooting, see the script source or ask for help in the project README.
