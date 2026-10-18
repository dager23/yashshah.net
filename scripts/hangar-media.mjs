/**
 * Fetches the demo media for /hangar into src/assets/hangar/.
 *
 *   npm run hangar:media
 *
 * Two sources, both mine:
 *   1. screenshots committed to my own project repos (Second Opinion's
 *      submission assets) — copied here so the page doesn't hotlink GitHub;
 *   2. a live capture of the signals site, which regenerates every weekday,
 *      so re-run this when the shot starts looking stale.
 *
 * Both steps are optional at build time: src/pages/hangar/index.astro renders
 * the synoptic alone when a file is missing, so a failed fetch never breaks a
 * deploy. Chrome is only needed for step 2 — set CHROME_PATH / PUPPETEER_CORE
 * if they aren't where this looks.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import sharp from 'sharp';

const OUT = path.join(process.cwd(), 'src', 'assets', 'hangar');
const RAW = 'https://raw.githubusercontent.com/dager23/second-opinion/main/docs/submission/assets';

/** the four shots the page shows, in the order it shows them */
const FROM_REPO = ['01-guard-stop.png', '02-case-report.png', '03-scam-check.png', '07-guardian.png'];

const LIVE = {
  url: 'https://dager23.github.io/nse-bse-signals/',
  file: 'signals.png',
  viewport: { width: 1280, height: 860 },
};

const CHROME =
  process.env.CHROME_PATH ??
  [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
  ].find((p) => existsSync(p));

async function fromRepo() {
  for (const file of FROM_REPO) {
    const res = await fetch(`${RAW}/${file}`);
    if (!res.ok) {
      console.warn(`  skip ${file} — HTTP ${res.status}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    // these are phone captures; 900px wide is more than the panel ever renders
    const out = await sharp(buf).resize({ width: 900, withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer();
    await writeFile(path.join(OUT, file), out);
    console.log(`  ${file}  ${(buf.length / 1024) | 0}KB → ${(out.length / 1024) | 0}KB`);
  }
}

async function fromLive() {
  if (!CHROME) {
    console.warn('  skip live capture — no Chrome found (set CHROME_PATH)');
    return;
  }
  let puppeteer;
  try {
    const require = createRequire(import.meta.url);
    puppeteer = require(process.env.PUPPETEER_CORE ?? 'puppeteer-core');
  } catch {
    console.warn('  skip live capture — puppeteer-core not installed (set PUPPETEER_CORE to a copy)');
    return;
  }
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport(LIVE.viewport);
    await page.goto(LIVE.url, { waitUntil: 'networkidle2', timeout: 60_000 });
    // the table is rendered from a JSON payload after load
    await new Promise((r) => setTimeout(r, 2500));
    const buf = await page.screenshot({ type: 'png' });
    const out = await sharp(buf).png({ compressionLevel: 9 }).toBuffer();
    await writeFile(path.join(OUT, LIVE.file), out);
    console.log(`  ${LIVE.file}  ${(out.length / 1024) | 0}KB  (${LIVE.viewport.width}×${LIVE.viewport.height})`);
  } finally {
    await browser.close();
  }
}

await mkdir(OUT, { recursive: true });
console.log('from my repos:');
await fromRepo();
console.log('from the live site:');
await fromLive();
console.log('done.');
