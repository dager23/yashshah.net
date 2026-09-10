// Regenerates public/og.png and the favicon set from geometric primitives + the
// site's own typefaces. Deterministic and offline. Run: npm run gen:images
//
// resvg needs static (non-variable) TTF/OTF and an ABSOLUTE fontFiles path.
// The two files in scripts/fonts/ are single-weight, latin-subset instances of
// the webfonts, frozen with:
//   python -m fontTools.ttLib.woff2 decompress -o v.ttf <name>.woff2
//   fonttools varLib.instancer v.ttf wght=460 opsz=18 -o scripts/fonts/newsreader-static.ttf
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const SERIF_FILE = resolve('scripts/fonts/newsreader-static.ttf');
const MONO_FILE = resolve('scripts/fonts/jetbrainsmono-static.ttf');
const SERIF = 'Newsreader 16pt';
const MONO = 'JetBrains Mono';

const PAPER = '#fbf9f4';
const INK = '#16150f';
const INK2 = '#56534a';
const RULE = '#cfc9ba';
const SIGNAL = '#b03a1f';

function render(svg, width, defaultFontFamily) {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: {
      fontFiles: [SERIF_FILE, MONO_FILE],
      loadSystemFonts: false,
      defaultFontFamily,
    },
    background: 'rgba(0,0,0,0)',
  })
    .render()
    .asPng();
}

/* ---------- Open Graph card: 1200 x 630 ---------- */
const spineX = 240;
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${PAPER}"/>
  <line x1="${spineX}" y1="0" x2="${spineX}" y2="630" stroke="${RULE}" stroke-width="2"/>
  <circle cx="${spineX}" cy="300" r="9" fill="${SIGNAL}"/>
  <text x="112" y="150" font-family="${MONO}" font-size="24" letter-spacing="6" fill="${INK2}">YASH SHAH</text>
  <text x="300" y="320" font-family="${SERIF}" font-size="94" fill="${INK}">SDE 2 at NetApp.</text>
  <text x="300" y="388" font-family="${SERIF}" font-size="38" fill="${INK2}">Computer-vision and machine-learning systems.</text>
  <text x="300" y="520" font-family="${MONO}" font-size="24" letter-spacing="2" fill="${INK2}">yashshah.net</text>
</svg>`;
writeFileSync('public/og.png', render(og, 1200, SERIF));
console.log('wrote public/og.png (1200x630)');

/* ---------- favicon: spine + dot, no text ---------- */
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect x="13.5" y="3" width="2.6" height="26" rx="1.3" fill="#726d61"/>
  <circle cx="14.8" cy="15" r="5.4" fill="${SIGNAL}"/>
</svg>
`;
writeFileSync('public/favicon.svg', faviconSvg);
console.log('wrote public/favicon.svg');

const png32 = render(faviconSvg, 32, SERIF);
writeFileSync('public/favicon-32.png', png32);

const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" fill="${PAPER}"/>
  <rect x="82" y="34" width="15" height="112" rx="7" fill="#726d61"/>
  <circle cx="89" cy="98" r="30" fill="${SIGNAL}"/>
</svg>`;
writeFileSync('public/apple-touch-icon.png', render(appleSvg, 180, SERIF));
console.log('wrote public/favicon-32.png, public/apple-touch-icon.png');

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
