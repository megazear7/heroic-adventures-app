import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const spaceId = process.env.CONTENTFUL_SPACE_ID;
const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;

const data = JSON.parse(readFileSync('.work/02-features.json', 'utf8'));
const pending = data.features.filter((f) => f.status === 'pending');
const titles = pending.map((f) => f.title);

console.log(`Checking ${titles.length} pending titles for conflicts...\n`);

// Fetch all existing ruleReference entries (paginated)
async function fetchAllEntries() {
  const entries = [];
  let skip = 0;
  const limit = 100;
  while (true) {
    const res = await fetch(
      `https://api.contentful.com/spaces/${spaceId}/environments/master/entries?content_type=ruleReference&select=fields.title,sys.id&limit=${limit}&skip=${skip}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const json = await res.json();
    entries.push(...json.items);
    if (entries.length >= json.total) break;
    skip += limit;
  }
  return entries;
}

async function main() {
  const existing = await fetchAllEntries();
  console.log(`Found ${existing.length} existing ruleReference entries.\n`);

  const existingTitles = new Map();
  for (const e of existing) {
    const title = e.fields.title?.['en-US'];
    if (title) existingTitles.set(title, e.sys.id);
  }

  const conflicts = [];
  for (const t of titles) {
    if (existingTitles.has(t)) {
      conflicts.push({ title: t, existingId: existingTitles.get(t) });
    }
  }

  if (conflicts.length === 0) {
    console.log('No conflicts found! All pending titles are unique.');
  } else {
    console.log(`Found ${conflicts.length} conflict(s):`);
    for (const c of conflicts) {
      const feature = pending.find((f) => f.title === c.title);
      console.log(
        `  - "${c.title}" (${feature.parentName}) conflicts with existing entry ${c.existingId}`
      );
    }
  }
}

main().catch(console.error);
