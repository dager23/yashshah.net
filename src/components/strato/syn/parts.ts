/**
 * Primitives for the ECAM synoptics on /hangar.
 *
 * Each diagram is composed from these rather than hand-plotted, so boxes line up
 * on a shared grid and the wires meet their edges exactly. Everything returns an
 * SVG fragment string; colour lives in strato-hangar.css (class names only here)
 * so both themes and reduced-motion are handled in one place.
 *
 * Canvas is 640×360 for every diagram. Narrow screens scroll the panel rather
 * than shrinking the type below legibility.
 */

export const W = 640;
export const H = 360;

export type Tone = 'instr' | 'amber' | 'teal' | 'dim';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** right edge mid-point, left edge mid-point, etc — so wires attach to geometry, not guesses */
export const rightOf = (b: Box): [number, number] => [b.x + b.w, b.y + b.h / 2];
export const leftOf = (b: Box): [number, number] => [b.x, b.y + b.h / 2];
export const topOf = (b: Box): [number, number] => [b.x + b.w / 2, b.y];
export const botOf = (b: Box): [number, number] => [b.x + b.w / 2, b.y + b.h];

/**
 * A labelled box. `sub` lines are stacked under the title at a smaller size —
 * pass the mechanism, not marketing.
 */
export function box(
  b: Box,
  title: string,
  opts: { sub?: string[]; tone?: Tone; mono?: boolean } = {}
): string {
  const { sub = [], tone = 'instr', mono = false } = opts;
  const cx = b.x + b.w / 2;
  // title sits above the sub-lines; with no subs it centres in the box
  const titleY = sub.length ? b.y + b.h / 2 - sub.length * 5.5 : b.y + b.h / 2 + 3.5;
  const lines = sub
    .map((s, i) => `<text class="syn-sub" x="${cx}" y="${titleY + 11 + i * 10}">${esc(s)}</text>`)
    .join('');
  return (
    `<g class="syn-node syn--${tone}">` +
    `<rect class="syn-box" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="7" />` +
    `<text class="syn-ttl${mono ? ' syn-mono' : ''}" x="${cx}" y="${titleY}">${esc(title)}</text>` +
    lines +
    `</g>`
  );
}

/** a small pill — used for inputs, outputs and seam kinds */
export function chip(b: Box, label: string, tone: Tone = 'dim'): string {
  return (
    `<g class="syn-node syn--${tone}">` +
    `<rect class="syn-chip" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${b.h / 2}" />` +
    `<text class="syn-chip-t syn-mono" x="${b.x + b.w / 2}" y="${b.y + b.h / 2 + 3}">${esc(label)}</text>` +
    `</g>`
  );
}

/**
 * A wire between two points. `flow` animates a dash along it — used sparingly,
 * on the path that carries the project's main signal.
 */
export function wire(
  from: [number, number],
  to: [number, number],
  opts: { tone?: Tone; flow?: boolean; bend?: 'h' | 'v' | 'none'; label?: string; arrow?: boolean } = {}
): string {
  const { tone = 'dim', flow = false, bend = 'h', label, arrow = true } = opts;
  const [x1, y1] = from;
  const [x2, y2] = to;
  let d: string;
  if (bend === 'none' || y1 === y2) d = `M${x1} ${y1} L${x2} ${y2}`;
  else if (bend === 'h') {
    // out horizontally, turn once, in horizontally — the ECAM house style
    const mx = (x1 + x2) / 2;
    d = `M${x1} ${y1} H${mx} V${y2} H${x2}`;
  } else {
    const my = (y1 + y2) / 2;
    d = `M${x1} ${y1} V${my} H${x2} V${y2}`;
  }
  const head = arrow ? ` marker-end="url(#syn-arw-${tone})"` : '';
  const lbl = label
    ? `<text class="syn-wlbl syn-mono" x="${(x1 + x2) / 2}" y="${Math.min(y1, y2) - 5}">${esc(label)}</text>`
    : '';
  return `<path class="syn-wire syn--${tone}${flow ? ' syn-flow' : ''}" d="${d}"${head} />${lbl}`;
}

/** a free label, left-aligned by default */
export function label(
  x: number,
  y: number,
  s: string,
  opts: { anchor?: 'start' | 'middle' | 'end'; tone?: Tone; mono?: boolean; size?: 'xs' | 'sm' } = {}
): string {
  const { anchor = 'start', tone = 'dim', mono = true, size = 'xs' } = opts;
  return (
    `<text class="syn-lbl syn-${size}${mono ? ' syn-mono' : ''} syn--${tone}" ` +
    `x="${x}" y="${y}" text-anchor="${anchor}">${esc(s)}</text>`
  );
}

/** a section heading inside the diagram */
export function heading(x: number, y: number, s: string, anchor: 'start' | 'middle' | 'end' = 'start'): string {
  return `<text class="syn-head syn-mono" x="${x}" y="${y}" text-anchor="${anchor}">${esc(s)}</text>`;
}

/** dashed enclosure, for grouping a stage of the pipeline */
export function group(b: Box, title?: string, tone: Tone = 'dim'): string {
  const t = title
    ? `<text class="syn-grp syn-mono" x="${b.x + 9}" y="${b.y + 13}">${esc(title)}</text>`
    : '';
  return (
    `<g class="syn--${tone}"><rect class="syn-group" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="9" />${t}</g>`
  );
}

/** arrow-head defs; ids are suffixed per tone and shared across diagrams on the page */
export function defs(): string {
  const tones: Tone[] = ['instr', 'amber', 'teal', 'dim'];
  return (
    `<defs>` +
    tones
      .map(
        (t) =>
          `<marker id="syn-arw-${t}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5.5" markerHeight="5.5" orient="auto">` +
          `<path class="syn-arw syn--${t}" d="M0 0.8 L7.4 4 L0 7.2 Z" /></marker>`
      )
      .join('') +
    `</defs>`
  );
}
