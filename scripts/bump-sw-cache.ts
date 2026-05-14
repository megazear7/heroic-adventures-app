import {readFileSync, writeFileSync} from 'fs';
import {createHash} from 'crypto';
import {resolve} from 'path';

const SW_PATH = resolve('dist', 'sw.js');
const BUNDLE_PATH = resolve('dist', 'bundle.js');
const CONTENT_INDEX_PATH = resolve('dist', 'content', 'index.json');

function fileHash(filePath: string): string {
  const buf = readFileSync(filePath);
  return createHash('sha256').update(buf).digest('hex').slice(0, 8);
}

const bundleHash = fileHash(BUNDLE_PATH);

let contentHash = '';
try {
  contentHash = fileHash(CONTENT_INDEX_PATH);
} catch {
  // content/index.json may not exist in all build configurations
}

const hash = contentHash ? `${bundleHash}-${contentHash}` : bundleHash;

const content = readFileSync(SW_PATH, 'utf-8');
const match = content.match(/const CACHE_NAME = "heroic-(v\d+).*?";/);

if (!match) {
  console.error('ERROR: CACHE_NAME not found in sw.js');
  process.exit(1);
}

const version = match[1];
const newCacheName = `heroic-${version}-${hash}`;
const updated = content.replace(
  /const CACHE_NAME = ".*?";/,
  `const CACHE_NAME = "${newCacheName}";`
);

writeFileSync(SW_PATH, updated);
console.log(`SW cache name bumped to: ${newCacheName}`);
