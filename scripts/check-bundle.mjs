import { readFile, readdir, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const assetDir = new URL('../dist/assets/', import.meta.url);
const assets = await readdir(assetDir);

const findAsset = (pattern, label) => {
  const name = assets.find(value => pattern.test(value));
  if (!name) throw new Error(`Missing ${label} asset in dist/assets`);
  return name;
};

const budgets = [
  { label: 'initial JS', pattern: /^main-[^/]+\.js$/, limit: 20 * 1024 },
  { label: 'initial CSS', pattern: /^main-[^/]+\.css$/, limit: 9 * 1024 },
  { label: 'deferred 3D JS', pattern: /^ScrollWorld-[^/]+\.js$/, limit: 160 * 1024 },
  { label: 'logo texture', pattern: /^raza_logo_no_bg-[^/]+\.webp$/, limit: 50 * 1024 },
];

let failed = false;
for (const budget of budgets) {
  const name = findAsset(budget.pattern, budget.label);
  const file = new URL(`../dist/assets/${name}`, import.meta.url);
  const source = await stat(file);
  const bytes = gzipSync(await readFile(file), { level: 9 }).byteLength;
  const status = bytes <= budget.limit ? 'PASS' : 'FAIL';
  console.log(`${status} ${budget.label}: ${(bytes / 1024).toFixed(2)} KB gzip (budget ${(budget.limit / 1024).toFixed(0)} KB; raw ${(source.size / 1024).toFixed(2)} KB)`);
  if (bytes > budget.limit) failed = true;
}

if (failed) process.exitCode = 1;
