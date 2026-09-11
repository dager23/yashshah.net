/**
 * No-WebGL / low-end fallback: the same route in 2D, with an SVG flight-path
 * marker moved by transform only.
 */
import { DESKTOP, MOBILE, isNarrow, type Pt } from './path';
import { getState, subscribe } from './store';

// the same Concorde-style delta as the WebGL sprite (scene.ts), nose up
const MARKER = `<svg viewBox="0 0 160 160" aria-hidden="true"><path d="M80 8 L83 28 L84.5 58 Q98 92 132 128 L130 134 L92 133 L86 146 L82.5 152 L80 154 L77.5 152 L74 146 L68 133 L30 134 L28 128 Q62 92 75.5 58 L77 28 Z" fill="rgba(127,211,255,.3)" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><g fill="rgba(232,237,245,.8)"><rect x="94" y="108" width="20" height="24"/><rect x="46" y="108" width="20" height="24"/><rect x="79" y="96" width="2" height="50"/></g></svg>`;

/** uniform Catmull-Rom through the control points, re-sampled by arc length */
function route(pts: Pt[], w: number, h: number, n = 240): Pt[] {
  const px = pts.map(([x, y]): Pt => [(x * 0.5 + 0.5) * w, (0.5 - y * 0.5) * h]);
  const raw: Pt[] = [];
  const segs = px.length - 1;
  for (let i = 0; i <= n * 4; i++) {
    const t = (i / (n * 4)) * segs, k = Math.min(segs - 1, Math.floor(t)), f = t - k;
    const [a, b, c, d] = [px[Math.max(0, k - 1)], px[k], px[k + 1], px[Math.min(segs, k + 2)]];
    const cr = (p0: number, p1: number, p2: number, p3: number) =>
      0.5 * (2 * p1 + (p2 - p0) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (3 * p1 - p0 - 3 * p2 + p3) * f * f * f);
    raw.push([cr(a[0], b[0], c[0], d[0]), cr(a[1], b[1], c[1], d[1])]);
  }
  const len = [0];
  for (let i = 1; i < raw.length; i++) len.push(len[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
  const out: Pt[] = [];
  for (let i = 0, j = 0; i <= n; i++) {
    const target = (i / n) * len[len.length - 1];
    while (j < len.length - 2 && len[j + 1] < target) j++;
    const f = (target - len[j]) / Math.max(1e-6, len[j + 1] - len[j]);
    out.push([raw[j][0] + (raw[j + 1][0] - raw[j][0]) * f, raw[j][1] + (raw[j + 1][1] - raw[j][1]) * f]);
  }
  return out;
}

/** Starts the 2D route; returns a stop function (used when WebGL takes over). */
export function startFallback(): () => void {
  const el = document.createElement('div');
  el.className = 'fallback-plane';
  el.innerHTML = MARKER;
  document.body.appendChild(el);

  let pts = route(isNarrow() ? MOBILE : DESKTOP, innerWidth, innerHeight);
  const onResize = () => { pts = route(isNarrow() ? MOBILE : DESKTOP, innerWidth, innerHeight); draw(getState().u); };
  addEventListener('resize', onResize);

  function draw(u: number): void {
    const i = Math.min(pts.length - 1, Math.max(0, Math.round(u * (pts.length - 1))));
    const [x, y] = pts[i];
    const [nx, ny] = pts[Math.min(pts.length - 1, i + 4)];
    const heading = Math.atan2(ny - y, nx - x); // screen space: y down, so nose-up needs +90°
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(heading + Math.PI / 2).toFixed(3)}rad)`;
  }
  const unsubscribe = subscribe((s) => draw(s.u));
  return () => {
    unsubscribe();
    removeEventListener('resize', onResize);
    el.remove();
  };
}
