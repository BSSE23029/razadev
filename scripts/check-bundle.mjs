import { readFile, readdir, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const assetDir = new URL('../dist/assets/', import.meta.url);
const portalDir = new URL('../dist/scene/portal/', import.meta.url);
const assets = await readdir(assetDir);
const portalAssets = await readdir(portalDir);

const findAsset = (pattern, label) => {
  const name = assets.find(value => pattern.test(value));
  if (!name) throw new Error(`Missing ${label} asset in dist/assets`);
  return name;
};

const budgets = [
  { label: 'initial JS', pattern: /^main-[^/]+\.js$/, limit: 20 * 1024 },
  { label: 'initial CSS', pattern: /^main-[^/]+\.css$/, limit: 9 * 1024 },
  { label: 'deferred 3D JS', pattern: /^ScrollWorld-[^/]+\.js$/, limit: 160 * 1024 },
  { label: 'logo texture', pattern: /^raza_logo_ui_small-[^/]+\.webp$/, limit: 12 * 1024 },
];
let failed = false;

const initialJsName = findAsset(/^main-[^/]+\.js$/, 'initial JS');
const deferredJsName = findAsset(/^ScrollWorld-[^/]+\.js$/, 'deferred 3D JS');
const initialJs = await readFile(new URL(`../dist/assets/${initialJsName}`, import.meta.url), 'utf8');
const deferredJs = await readFile(new URL(`../dist/assets/${deferredJsName}`, import.meta.url), 'utf8');
const sceneSource = await readFile(new URL('../src/components/cinematic/ScrollWorld.js', import.meta.url), 'utf8');
const forbiddenInitialPatterns = [
  { label: 'Three.js in initial JS', pattern: /WebGLRenderer|three\/build/ },
  { label: 'runtime GitHub API in initial JS', pattern: /api\.github\.com|github-readme-stats|profile-summary-cards|streak-stats/ },
];

for (const check of forbiddenInitialPatterns) {
  const failedCheck = check.pattern.test(initialJs);
  console.log(`${failedCheck ? 'FAIL' : 'PASS'} ${check.label}`);
  if (failedCheck) failed = true;
}

const deferredHasSceneCode = /WebGLRenderer/.test(deferredJs);
console.log(`${deferredHasSceneCode ? 'PASS' : 'FAIL'} deferred scene contains Three.js renderer code`);
if (!deferredHasSceneCode) failed = true;

const removedScenePatterns = [
  { label: 'space-only scene (legacy logo/phone models absent)', pattern: /_create(?:Mobile|Network|Backend|Transit|Packets)|logoTexture|RoundedBoxGeometry/ },
];
for (const check of removedScenePatterns) {
  const failedCheck = check.pattern.test(sceneSource);
  console.log(`${failedCheck ? 'FAIL' : 'PASS'} ${check.label}`);
  if (failedCheck) failed = true;
}

for (const budget of budgets) {
  const name = findAsset(budget.pattern, budget.label);
  const file = new URL(`../dist/assets/${name}`, import.meta.url);
  const source = await stat(file);
  const bytes = gzipSync(await readFile(file), { level: 9 }).byteLength;
  const status = bytes <= budget.limit ? 'PASS' : 'FAIL';
  console.log(`${status} ${budget.label}: ${(bytes / 1024).toFixed(2)} KB gzip (budget ${(budget.limit / 1024).toFixed(0)} KB; raw ${(source.size / 1024).toFixed(2)} KB)`);
  if (bytes > budget.limit) failed = true;
}

const portalTextureNames = ['dark-smoke.webp', 'smoke.webp', 'colored-smoke.webp'];
const legacyPortalAssets = portalAssets.filter(name => name.endsWith('.png'));
const portalTextureBytes = await Promise.all(portalTextureNames.map(async name => {
  const source = await stat(new URL(name, portalDir));
  return source.size;
}));
const portalBytes = portalTextureBytes.reduce((total, bytes) => total + bytes, 0);
const portalBudget = 340 * 1024;
const portalPasses = legacyPortalAssets.length === 0 && portalBytes <= portalBudget;
console.log(`${portalPasses ? 'PASS' : 'FAIL'} portal textures: ${(portalBytes / 1024).toFixed(2)} KB raw (budget ${(portalBudget / 1024).toFixed(0)} KB; webp only)`);
if (!portalPasses) failed = true;

if (failed) process.exitCode = 1;
