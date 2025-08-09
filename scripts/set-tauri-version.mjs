import { readFileSync, writeFileSync } from 'node:fs';

const version = process.argv[2];
if (!version) {
  console.error('Usage: set-tauri-version <version>');
  process.exit(1);
}
const path = 'src-tauri/tauri.conf.json';
const data = JSON.parse(readFileSync(path, 'utf8'));
data.version = version;
writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
console.log(`Updated ${path} to ${version}`);