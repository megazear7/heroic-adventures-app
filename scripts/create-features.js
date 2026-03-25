#!/usr/bin/env node

/**
 * Creates feature entries in Contentful from .work/02-features.json.
 *
 * Usage:
 *   node scripts/create-features.js --init              Parse markdown → JSON
 *   node scripts/create-features.js --status            Show status summary
 *   node scripts/create-features.js                     Create next 10 pending
 *   node scripts/create-features.js --count 20          Create next 20 pending
 *   node scripts/create-features.js --all               Create all pending
 *   node scripts/create-features.js --rerun             Update/create up to 10
 *   node scripts/create-features.js --rerun --all       Update/create everything
 *
 * Env: CONTENTFUL_SPACE_ID, CONTENTFUL_MANAGEMENT_TOKEN
 */

import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

/* ---------- Configuration ---------- */

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const ENV_ID = process.env.CONTENTFUL_ENV_ID || 'master';
const ACCESS_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN;

const FEATURES_MD = path.resolve('.work/02-features.md');
const FEATURES_JSON = path.resolve('.work/02-features.json');
const BASE_URL = `https://api.contentful.com/spaces/${SPACE_ID}/environments/${ENV_ID}`;
const DELAY_MS = 300;

/* ---------- CLI ---------- */

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {
    init: args.includes('--init'),
    status: args.includes('--status'),
    rerun: args.includes('--rerun'),
    all: args.includes('--all'),
    count: 10,
    help: args.includes('--help') || args.includes('-h'),
  };
  const countIdx = args.indexOf('--count');
  if (countIdx !== -1 && args[countIdx + 1]) {
    flags.count = parseInt(args[countIdx + 1], 10);
  }
  return flags;
}

function showHelp() {
  console.log(`
Usage: node scripts/create-features.js [options]

Options:
  --init          Parse .work/02-features.md and generate .work/02-features.json
  --status        Show status summary of all features
  --rerun         Update already-created entries and create pending ones
  --count N       Number of features to process (default: 10)
  --all           Process all features (overrides --count)
  --help, -h      Show this help message

Examples:
  node scripts/create-features.js --init              Generate JSON from markdown
  node scripts/create-features.js --status            Show status
  node scripts/create-features.js                     Create next 10 pending
  node scripts/create-features.js --count 20          Create next 20 pending
  node scripts/create-features.js --all               Create all pending
  node scripts/create-features.js --rerun --all       Update/create all
`);
}

/* ---------- Markdown Parsing ---------- */

function parseMarkdown(content) {
  const features = [];
  let currentParentType = null;
  let currentParentName = null;
  let currentParentId = null;
  let order = 0;
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Stop at "# Updates" section
    if (line.startsWith('# Updates')) break;

    const raceMatch = line.match(/^## Race: (.+) Features$/);
    if (raceMatch) {
      currentParentType = 'race';
      currentParentName = raceMatch[1];
      order = 0;
      i++;
      const idMatch = (lines[i] || '').match(/^Race ID: (.+)$/);
      if (idMatch) currentParentId = idMatch[1].trim();
      i++;
      continue;
    }

    const classMatch = line.match(/^## Class: (.+) Features$/);
    if (classMatch) {
      currentParentType = 'class';
      currentParentName = classMatch[1];
      order = 0;
      i++;
      const idMatch = (lines[i] || '').match(/^Class ID: (.+)$/);
      if (idMatch) currentParentId = idMatch[1].trim();
      i++;
      continue;
    }

    const featureMatch = line.match(/^### .+ Feature: (.+)$/);
    if (featureMatch && currentParentName) {
      const title = featureMatch[1].trim();
      order++;
      i++;

      // Collect description lines until next heading
      const descLines = [];
      while (i < lines.length && !lines[i].startsWith('#')) {
        descLines.push(lines[i]);
        i++;
      }

      // Trim leading/trailing empty lines
      while (descLines.length && descLines[0].trim() === '') descLines.shift();
      while (descLines.length && descLines[descLines.length - 1].trim() === '') descLines.pop();

      features.push({
        title,
        parentType: currentParentType,
        parentName: currentParentName,
        parentId: currentParentId,
        subcategory: `${currentParentName} Feature`,
        description: descLines.join('\n'),
        order,
        status: 'pending',
        entryId: null,
        error: null,
      });
      continue;
    }

    i++;
  }

  return features;
}

/* ---------- Rich Text Conversion ---------- */

function parseInlineMarkdown(text) {
  const nodes = [];
  // Match **bold** before *italic*
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({
        nodeType: 'text',
        value: text.slice(lastIndex, match.index),
        marks: [],
        data: {},
      });
    }

    if (match[1] !== undefined) {
      nodes.push({
        nodeType: 'text',
        value: match[1],
        marks: [{ type: 'bold' }],
        data: {},
      });
    } else {
      nodes.push({
        nodeType: 'text',
        value: match[2],
        marks: [{ type: 'italic' }],
        data: {},
      });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push({
      nodeType: 'text',
      value: text.slice(lastIndex),
      marks: [],
      data: {},
    });
  }

  if (nodes.length === 0) {
    nodes.push({ nodeType: 'text', value: '', marks: [], data: {} });
  }

  return nodes;
}

function descriptionToRichText(title, description) {
  const content = [
    {
      nodeType: 'heading-3',
      data: {},
      content: [{ nodeType: 'text', value: title, marks: [], data: {} }],
    },
  ];

  const paragraphs = description.split(/\n\n+/);
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (trimmed) {
      content.push({
        nodeType: 'paragraph',
        data: {},
        content: parseInlineMarkdown(trimmed),
      });
    }
  }

  return { nodeType: 'document', data: {}, content };
}

/* ---------- Contentful API ---------- */

function buildEntryBody(feature) {
  return {
    fields: {
      title: { 'en-US': feature.title },
      category: { 'en-US': 'feature' },
      subcategory: { 'en-US': feature.subcategory },
      content: {
        'en-US': descriptionToRichText(feature.title, feature.description),
      },
      ruleReferences: {
        'en-US': [
          { sys: { type: 'Link', linkType: 'Entry', id: feature.parentId } },
        ],
      },
      order: { 'en-US': feature.order },
    },
  };
}

async function createEntry(feature) {
  const body = buildEntryBody(feature);
  const res = await fetch(`${BASE_URL}/entries`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/vnd.contentful.management.v1+json',
      'X-Contentful-Content-Type': 'ruleReference',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Create ${res.status}: ${JSON.stringify(data.message || data)}`);
  }
  return { entryId: data.sys.id, version: data.sys.version };
}

async function updateEntry(feature) {
  // Get current version
  const getRes = await fetch(`${BASE_URL}/entries/${feature.entryId}`, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  });
  if (!getRes.ok) {
    throw new Error(`GET ${getRes.status}: could not fetch entry ${feature.entryId}`);
  }
  const current = await getRes.json();
  const version = current.sys.version;

  const body = buildEntryBody(feature);
  const putRes = await fetch(`${BASE_URL}/entries/${feature.entryId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/vnd.contentful.management.v1+json',
      'X-Contentful-Version': version.toString(),
    },
    body: JSON.stringify(body),
  });
  const putData = await putRes.json();
  if (!putRes.ok) {
    throw new Error(`Update ${putRes.status}: ${JSON.stringify(putData.message || putData)}`);
  }
  return { version: putData.sys.version };
}

async function publishEntry(entryId, version) {
  const res = await fetch(`${BASE_URL}/entries/${entryId}/published`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/vnd.contentful.management.v1+json',
      'X-Contentful-Version': version.toString(),
    },
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(`Publish ${res.status}: ${JSON.stringify(data.message || data)}`);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ---------- JSON File I/O ---------- */

async function loadFeatures() {
  const raw = await fs.readFile(FEATURES_JSON, 'utf-8');
  return JSON.parse(raw);
}

async function saveFeatures(data) {
  await fs.writeFile(FEATURES_JSON, JSON.stringify(data, null, 2) + '\n');
}

/* ---------- Status Display ---------- */

function showStatus(data) {
  const { features } = data;
  const pending = features.filter(f => f.status === 'pending');
  const created = features.filter(f => f.status === 'created');
  const errors = features.filter(f => f.status === 'error');

  console.log(`\nFeature Status Summary`);
  console.log(`─────────────────────`);
  console.log(`Total:   ${features.length}`);
  console.log(`Pending: ${pending.length}`);
  console.log(`Created: ${created.length}`);
  console.log(`Errors:  ${errors.length}`);

  if (errors.length > 0) {
    console.log(`\nErrors:`);
    for (const f of errors) {
      console.log(`  - ${f.title} (${f.parentName}): ${f.error}`);
    }
  }

  const byParent = {};
  for (const f of features) {
    const key = `${f.parentName} (${f.parentType})`;
    if (!byParent[key]) byParent[key] = { pending: 0, created: 0, error: 0 };
    byParent[key][f.status]++;
  }

  console.log(`\nBy Parent:`);
  for (const [name, counts] of Object.entries(byParent)) {
    const parts = [];
    if (counts.created) parts.push(`${counts.created} created`);
    if (counts.pending) parts.push(`${counts.pending} pending`);
    if (counts.error) parts.push(`${counts.error} error`);
    console.log(`  ${name}: ${parts.join(', ')}`);
  }
  console.log('');
}

/* ---------- Main ---------- */

async function main() {
  const flags = parseArgs();

  if (flags.help) {
    showHelp();
    return;
  }

  // --init: generate JSON from markdown
  if (flags.init) {
    console.log('Parsing', FEATURES_MD, '...');
    const md = await fs.readFile(FEATURES_MD, 'utf-8');
    const features = parseMarkdown(md);
    console.log(`Found ${features.length} features.`);

    // Merge with existing JSON if present
    let existing = {};
    try {
      existing = await loadFeatures();
      console.log(`Merging with existing JSON (${existing.features?.length || 0} entries)...`);
    } catch {
      // File doesn't exist yet
    }

    if (existing.features) {
      const existingMap = new Map(existing.features.map(f => [f.title, f]));
      for (const f of features) {
        const prev = existingMap.get(f.title);
        if (prev) {
          f.status = prev.status;
          f.entryId = prev.entryId;
          f.error = prev.error;
        }
      }
    }

    await saveFeatures({ features });
    console.log(`Saved ${features.length} features to ${FEATURES_JSON}`);
    showStatus({ features });
    return;
  }

  // Require env vars for API operations
  if (!SPACE_ID || !ACCESS_TOKEN) {
    console.error('Missing CONTENTFUL_SPACE_ID or CONTENTFUL_MANAGEMENT_TOKEN env vars.');
    process.exit(1);
  }

  // Load existing JSON
  let data;
  try {
    data = await loadFeatures();
  } catch {
    console.error('No features JSON found. Run with --init first.');
    process.exit(1);
  }

  // --status
  if (flags.status) {
    showStatus(data);
    return;
  }

  // Determine which features to process
  let toProcess;
  if (flags.rerun) {
    toProcess = [...data.features];
  } else {
    toProcess = data.features.filter(f => f.status !== 'created');
  }

  const limit = flags.all ? toProcess.length : Math.min(flags.count, toProcess.length);
  toProcess = toProcess.slice(0, limit);

  if (toProcess.length === 0) {
    console.log('Nothing to process.');
    showStatus(data);
    return;
  }

  console.log(`Processing ${toProcess.length} feature(s)...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const feature of toProcess) {
    const label = `${feature.title} (${feature.parentName})`;
    try {
      if (feature.status === 'created' && feature.entryId && flags.rerun) {
        process.stdout.write(`  Updating: ${label}...`);
        const { version } = await updateEntry(feature);
        await publishEntry(feature.entryId, version);
        console.log(' ✓ updated & published');
      } else {
        process.stdout.write(`  Creating: ${label}...`);
        const { entryId, version } = await createEntry(feature);
        feature.entryId = entryId;
        await publishEntry(entryId, version);
        console.log(` ✓ ${entryId} (published)`);
      }
      feature.status = 'created';
      feature.error = null;
      successCount++;
    } catch (err) {
      feature.status = 'error';
      feature.error = err.message;
      console.log(` ✗ ${err.message}`);
      errorCount++;
    }

    // Save after each entry so progress isn't lost
    await saveFeatures(data);
    await delay(DELAY_MS);
  }

  console.log(`\nDone. ${successCount} succeeded, ${errorCount} failed.`);
  showStatus(data);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
