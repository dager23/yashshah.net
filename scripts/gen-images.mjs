// Regenerates public/og.png and the favicon set. Deterministic and offline.
//   - og.png: headless Chrome renders scripts/og.html (the site's own variable fonts + Earth texture)
//   - favicons: resvg rasterises an inline SVG of the HUD flight-path marker
// Run: npm run gen:images
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

/* ---------- Open Graph card: 1200 x 630 ---------- */
const CHROME = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((p) => p && existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set CHROME_PATH to the browser executable');

execFileSync(
  CHROME,
  [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--force-device-scale-factor=1', '--window-size=1200,630', '--virtual-time-budget=4000',
    `--screenshot=${resolve('public/og.png')}`, pathToFileURL(resolve('scripts/og.html')).href,
  ],
  { stdio: 'ignore' }
);
console.log('wrote public/og.png (1200x630)');

/* ---------- favicon: the flight-path marker on ink ---------- */
const INK = '#0b1020', INSTR = '#7fd3ff';
const marker = (s, r) => `<rect width="${s}" height="${s}" rx="${r}" fill="${INK}"/>
  <g fill="none" stroke="${INSTR}" stroke-width="${s * 0.078}" stroke-linecap="round" transform="translate(${s / 2} ${s * 0.54})">
    <circle r="${s * 0.135}"/>
    <path d="M${-s * 0.135} 0H${-s * 0.36}M${s * 0.135} 0H${s * 0.36}M0 ${-s * 0.135}V${-s * 0.31}"/>
  </g>`;
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  ${marker(32, 7)}
</svg>
`;
writeFileSync('public/favicon.svg', faviconSvg);

const render = (svg, width) => new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
const png32 = render(faviconSvg, 32);
writeFileSync('public/favicon-32.png', png32);
writeFileSync(
  'public/apple-touch-icon.png',
  render(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">${marker(180, 0)}</svg>`, 180)
);
console.log('wrote public/favicon.svg, favicon-32.png, apple-touch-icon.png');

/* ---------- favicon.ico wrapping the 32px PNG ---------- */
const ico = Buffer.alloc(22 + png32.length);
ico.writeUInt16LE(0, 0);
ico.writeUInt16LE(1, 2);
ico.writeUInt16LE(1, 4);
ico.writeUInt8(32, 6);
ico.writeUInt8(32, 7);
ico.writeUInt8(0, 8);
ico.writeUInt8(0, 9);
ico.writeUInt16LE(1, 10);
ico.writeUInt16LE(32, 12);
ico.writeUInt32LE(png32.length, 14);
ico.writeUInt32LE(22, 18);
png32.copy(ico, 22);
writeFileSync('public/favicon.ico', ico);
console.log('wrote public/favicon.ico');
