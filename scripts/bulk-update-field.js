#!/usr/bin/env node

import readline from 'readline';
import dotenv from 'dotenv';
dotenv.config();

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const ENV_ID = process.env.CONTENTFUL_ENV_ID || 'master';
const ACCESS_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN;

if (!SPACE_ID || !ACCESS_TOKEN) {
  console.error('Missing CONTENTFUL_SPACE_ID or CONTENTFUL_MANAGEMENT_TOKEN environment variable.');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  // Support --dry argument
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry');
  const filteredArgs = args.filter(arg => arg !== '--dry');
  const [contentType, fieldName, oldValue, newValue] = filteredArgs;
  console.log('--- Bulk Contentful Field Update ---');
  console.log('Content type:', contentType);
  console.log('Field name:', fieldName);
  console.log('Old value:', oldValue);
  console.log('New value:', newValue);
  console.log('Dry run:', dryRun);

  if (!contentType || !fieldName || !oldValue || !newValue) {
    console.error('Usage: node bulk-update-field.js <contentType> <fieldName> <oldValue> <newValue> [--dry]');
    process.exit(1);
  }

  rl.close();

  // Pagination support
  let allItems = [];
  let skip = 0;
  const limit = 100;
  let total = 0;
  console.log('Fetching entries with pagination...');
  do {
    // Add category filter to search URL
    const searchUrl = `https://api.contentful.com/spaces/${SPACE_ID}/environments/${ENV_ID}/entries?content_type=${contentType}&fields.category=${encodeURIComponent(oldValue)}&limit=${limit}&skip=${skip}`;
    console.log('Fetching:', searchUrl);
    let searchRes, searchData;
    try {
      searchRes = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/vnd.contentful.management.v1+json'
        }
      });
      searchData = await searchRes.json();
      if (!searchRes.ok) {
        console.error('Failed to fetch entries:', searchData);
        process.exit(1);
      }
    } catch (err) {
      console.error('Error fetching entries:', err);
      process.exit(1);
    }
    if (!searchData.items || !searchData.items.length) break;
    allItems = allItems.concat(searchData.items);
    total = searchData.total || allItems.length;
    skip += limit;
  } while (skip < total);

  if (!allItems.length) {
    console.log('No entries found for this content type.');
    return;
  }

  // Log field values for debugging
  console.log(`Fetched ${allItems.length} entries. Logging field values:`);
  allItems.forEach(entry => {
    const field = entry.fields[fieldName];
    const value = field && field['en-US'];
    console.log(`Entry ${entry.sys.id}: ${fieldName} = ${value}`);
  });

  const entries = allItems.filter(entry => {
    const field = entry.fields[fieldName];
    if (!field) return false;
    // Only check en-US locale
    return field['en-US'] === oldValue;
  });

  console.log(`Found ${entries.length} entries to update.`);

  for (const entry of entries) {
    const entryId = entry.sys.id;
    const version = entry.sys.version;
    const updateUrl = `https://api.contentful.com/spaces/${SPACE_ID}/environments/${ENV_ID}/entries/${entryId}`;
    const updatedFields = { ...entry.fields };
    updatedFields[fieldName]['en-US'] = newValue;

    if (dryRun) {
      console.log(`[DRY RUN] Would update entry ${entryId}`);
      console.log(`[DRY RUN] Would publish entry ${entryId}`);
      continue;
    }
    console.log(`Updating entry ${entryId}...`);
    let updateRes;
    try {
      updateRes = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/vnd.contentful.management.v1+json',
          'X-Contentful-Version': version
        },
        body: JSON.stringify({ fields: updatedFields })
      });
      if (!updateRes.ok) {
        const errorText = await updateRes.text();
        console.error(`Failed to update entry ${entryId}:`, errorText);
        continue;
      }
      console.log(`Updated entry ${entryId}`);
    } catch (err) {
      console.error(`Error updating entry ${entryId}:`, err);
      continue;
    }

    // Publish
    const publishUrl = `${updateUrl}/published`;
    console.log(`Publishing entry ${entryId}...`);
    let publishRes;
    try {
      publishRes = await fetch(publishUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/vnd.contentful.management.v1+json',
          'X-Contentful-Version': (version + 1)
        }
      });
      if (!publishRes.ok) {
        const errorText = await publishRes.text();
        console.error(`Failed to publish entry ${entryId}:`, errorText);
      } else {
        console.log(`Published entry ${entryId}`);
      }
    } catch (err) {
      console.error(`Error publishing entry ${entryId}:`, err);
    }
  }
}

main();
