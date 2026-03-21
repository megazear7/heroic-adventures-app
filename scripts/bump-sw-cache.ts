import {readFileSync, writeFileSync} from 'fs';
import {resolve} from 'path';

const SW_PATH = resolve('dist', 'sw.js');

const timestamp = Date.now();
const content = readFileSync(SW_PATH, 'utf-8');
const match = content.match(/const CACHE_NAME = "heroic-(v\d+).*?";/);

if (!match) {
  console.error('ERROR: CACHE_NAME not found in sw.js');
  process.exit(1);
}

const version = match[1];
const newCacheName = `heroic-${version}-deploy-${timestamp}`;
const updated = content.replace(
  /const CACHE_NAME = ".*?";/,
  `const CACHE_NAME = "${newCacheName}";`
);

writeFileSync(SW_PATH, updated);
console.log(`SW cache name bumped to: ${newCacheName}`);
