// Fails the build if a TODO placeholder leaked into the built output.
// Guards against shipping unfinished content (see plan.md, Phase 5).
import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const DIST = 'dist';
const TEXT_EXT = new Set(['.html', '.xml', '.txt', '.json', '.css', '.js', '.svg']);
const NEEDLE = 'TODO:';

/** @param {string} dir */
async function walk(dir) {
  /** @type {string[]} */
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (TEXT_EXT.has(extname(entry.name))) files.push(path);
  }
  return files;
}

let hits = 0;
try {
  for (const file of await walk(DIST)) {
    const text = await readFile(file, 'utf8');
    if (text.includes(NEEDLE)) {
      hits++;
      const line = text.split('\n').findIndex((l) => l.includes(NEEDLE)) + 1;
      console.error(`  ${file}:${line} contains "${NEEDLE}"`);
    }
  }
} catch (err) {
  if (err.code === 'ENOENT') {
    console.error(`check-todos: "${DIST}/" not found — run "astro build" first.`);
    process.exit(1);
  }
  throw err;
}

if (hits > 0) {
  console.error(`\ncheck-todos: found ${hits} file(s) with "${NEEDLE}" — build blocked.`);
  process.exit(1);
}
console.log('check-todos: no TODO placeholders in dist/ — ok');
