/**
 * Scroll choreography for the Stratosphere theme. Bundled module: runs once;
 * per-page wiring happens on astro:page-load (ClientRouter navigations).
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { cruise } from '../data/flightplan';
import { getState, setState, type Phase } from './store';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduced = getState().reduced;
let lenis: Lenis | null = null;
let ctx: gsap.Context | null = null;
let sceneRequested = false;

/* ─── flight profile ─────────────────────────────────────────────────── */
interface Keys {
  dawn0: number; dawn1: number; liftoff: number; mach1: number; cruise: number;
  descent: number; landing: number; dusk0: number; dusk1: number; touchdown: number;
}
let keys: Keys = {
  dawn0: 0.05, dawn1: 0.12, liftoff: 0.08, mach1: 0.3, cruise: 0.35,
  descent: 0.7, landing: 0.9, dusk0: 0.86, dusk1: 0.92, touchdown: 0.985,
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a || 1));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** progress at which `sel`'s edge sits `vp` of the viewport down from the top */
function at(sel: string, edge: 'top' | 'bottom', vp: number, fallback: number): number {
  const el = document.querySelector(sel);
  if (!el) return fallback;
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const r = el.getBoundingClientRect();
  return clamp01(((edge === 'top' ? r.top : r.bottom) + scrollY - vp * innerHeight) / max);
}

function computeKeys(): void {
  keys = {
    dawn0: at('[data-leg="takeoff"]', 'top', 0.5, 0.05),
    liftoff: at('[data-leg="takeoff"]', 'top', 0.3, 0.08),
    dawn1: at('#about', 'top', 1.0, 0.12),
    mach1: at('[data-leg="mach"]', 'top', 0.5, 0.3),
    cruise: at('#waypoints', 'top', 0.5, 0.35),
    descent: at('#log', 'top', 0.5, 0.7),
    dusk0: at('#contact', 'top', 1.2, 0.86),
    landing: at('#contact', 'top', 0.8, 0.9),
    dusk1: at('#contact', 'top', 0.55, 0.92),
    touchdown: Math.min(0.995, at('#contact', 'top', 0.1, 0.985)),
  };
}

function altitude(p: number): number {
  return cruise.altitudeFt * smooth(keys.liftoff * 0.9, keys.cruise, p) * (1 - smooth(keys.descent, keys.touchdown, p));
}

function mach(p: number): number {
  if (p < keys.liftoff) return lerp(0, 0.3, smooth(0, keys.liftoff, p));
  if (p < keys.mach1) return lerp(0.3, 1, smooth(keys.liftoff, keys.mach1, p));
  if (p < keys.cruise) return lerp(1, cruise.mach, smooth(keys.mach1, keys.cruise, p));
  if (p < keys.descent) return cruise.mach;
  if (p < keys.landing) return lerp(cruise.mach, 0.9, smooth(keys.descent, keys.landing, p));
  return lerp(0.9, 0, smooth(keys.landing, keys.touchdown, p));
}

/** scroll progress → position on the flight curve; phase anchors land on fixed curve points */
function toU(p: number): number {
  const xs = [0, keys.liftoff, keys.mach1, keys.cruise, keys.descent, keys.landing, keys.touchdown, 1];
  const us = [0, 0.08, 0.33, 0.45, 0.84, 0.94, 1, 1];
  for (let i = 1; i < xs.length; i++) {
    if (p <= xs[i]) return us[i - 1] + (us[i] - us[i - 1]) * clamp01((p - xs[i - 1]) / Math.max(1e-6, xs[i] - xs[i - 1]));
  }
  return 1;
}

function phaseOf(p: number): Phase {
  if (p < keys.liftoff) return 'gate';
  if (p < keys.cruise) return 'climb';
  if (p < keys.descent) return 'cruise';
  if (p < keys.landing) return 'descent';
  return 'landing';
}

/* ─── readout: odometer digits ───────────────────────────────────────── */
function odo(el: HTMLElement | null, text: string): void {
  if (!el || el.dataset.v === text) return;
  const rebuild = reduced || (el.dataset.v ?? '').length !== text.length || !el.querySelector('.odo');
  el.dataset.v = text;
  if (rebuild) {
    el.textContent = '';
    for (const ch of text) {
      if (/\d/.test(ch)) {
        const wrap = document.createElement('span');
        wrap.className = 'odo';
        const strip = document.createElement('span');
        strip.className = 'odo__strip';
        for (let d = 0; d < 10; d++) {
          const c = document.createElement('span');
          c.textContent = String(d);
          strip.appendChild(c);
        }
        wrap.appendChild(strip);
        el.appendChild(wrap);
      } else {
        el.appendChild(document.createTextNode(ch));
      }
    }
  }
  const strips = el.querySelectorAll<HTMLElement>('.odo__strip');
  let i = 0;
  for (const ch of text) if (/\d/.test(ch)) strips[i++].style.transform = `translateY(${-Number(ch) * 1.2}em)`;
}

/* ─── per-page state ─────────────────────────────────────────────────── */
const legLabel: Record<string, string> = {
  gate: 'GATE', about: 'CLIMB', waypoints: 'CRUISE', log: 'LOG', clearances: 'CLRNC', contact: 'LAND',
};
let activeLeg = 'gate';
let activeWpt: string | null = null;
let parkedIdent: string | null = null;
let els: {
  mach: HTMLElement | null; alt: HTMLElement | null; wpt: HTMLElement | null;
  fill: HTMLElement | null; dawn: HTMLElement | null; dusk: HTMLElement | null;
} = { mach: null, alt: null, wpt: null, fill: null, dawn: null, dusk: null };

let lastP = 0;
function update(scrollP: number): void {
  lastP = scrollP;
  const st = getState();
  const p = st.parked ? lerp(keys.cruise, keys.descent, 0.5) : scrollP;
  const phase: Phase = st.parked ? 'cruise' : phaseOf(p);
  setState({ progress: p, u: st.parked ? 0.62 : toU(p), phase, waypoint: st.parked ? parkedIdent : activeWpt });

  if (els.dawn) els.dawn.style.opacity = String(st.parked ? 0 : 1 - smooth(keys.dawn0, keys.dawn1, p));
  if (els.dusk) els.dusk.style.opacity = String(st.parked ? 0 : smooth(keys.dusk0, keys.dusk1, p));

  odo(els.mach, mach(p).toFixed(2));
  const alt = Math.round(altitude(p) / 100) * 100;
  odo(els.alt, `${String(alt).padStart(5, '0').replace(/(\d{2})(\d{3})$/, '$1,$2')} FT`);
  if (els.wpt) els.wpt.textContent = st.parked ? parkedIdent ?? 'CRUISE' : activeWpt ?? legLabel[activeLeg] ?? 'GATE';
  if (els.fill) els.fill.style.transform = `scaleX(${p.toFixed(4)})`;

  if (!st.parked && !reduced && !st.machBurst && p >= keys.mach1 && p < keys.descent) {
    setState({ machBurst: true });
    els.mach?.classList.add('is-amber');
    setTimeout(() => els.mach?.classList.remove('is-amber'), 1600);
  }
}

/* ─── split-flap board ───────────────────────────────────────────────── */
const FLAP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function flipBoard(board: HTMLElement): void {
  if (reduced) return;
  board.querySelectorAll<HTMLElement>('.flap > span').forEach((span, i) => {
    const final = span.textContent ?? '';
    const tl = gsap.timeline({ delay: 0.2 + i * 0.07 });
    const flips = 6 + ((i * 7) % 5);
    for (let k = 0; k < flips; k++) {
      tl.set(span, { textContent: FLAP_CHARS[(i * 11 + k * 5) % FLAP_CHARS.length] }).fromTo(
        span, { rotateX: -85 }, { rotateX: 0, duration: 0.055, ease: 'none' }
      );
    }
    tl.set(span, { textContent: final }).fromTo(span, { rotateX: -85 }, { rotateX: 0, duration: 0.16, ease: 'expo.out' });
  });
}

/* ─── masked line reveals, once each ─────────────────────────────────── */
function reveals(): void {
  if (reduced) return;
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110,
          duration: 0.6,
          ease: 'expo.out',
          stagger: 0.06,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }),
    });
  });
}

/* ─── triggers ───────────────────────────────────────────────────────── */
function triggers(): void {
  document.querySelectorAll<HTMLElement>('#gate, #about, #waypoints, #log, #clearances, #contact').forEach((el) => {
    ScrollTrigger.create({
      trigger: el, start: 'top 50%', end: 'bottom 50%',
      // toggles fire after the master update in the same tick — refresh the label
      onToggle: (self) => { if (self.isActive) { activeLeg = el.id; update(lastP); } },
    });
  });
  document.querySelectorAll<HTMLElement>('.wpt').forEach((el) => {
    const ident = el.dataset.wpt ?? null;
    const panel = el.querySelector('.panel');
    ScrollTrigger.create({
      trigger: el, start: 'top 62%', end: 'bottom 38%',
      onEnter: () => panel?.classList.add('is-docked'),
      onToggle: (self) => {
        if (self.isActive) activeWpt = ident;
        else if (activeWpt === ident) activeWpt = null;
        update(lastP);
      },
    });
  });
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => update(self.progress),
    onRefresh: (self) => { computeKeys(); update(self.progress); },
  });
}

/* ─── lifecycle ──────────────────────────────────────────────────────── */
function initLenis(): void {
  if (reduced || lenis) return;
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, anchors: true, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

function requestScene(): void {
  if (sceneRequested) return;
  const canvas = document.getElementById('scene') as HTMLCanvasElement | null;
  if (!canvas) return;
  sceneRequested = true;
  const fallback = () => import('./fallback2d').then((f) => f.startFallback());
  const go = () =>
    import('./scene')
      .then((m) => (m.startScene(canvas) ? undefined : fallback()))
      .catch((e) => { console.warn('scene unavailable, using 2D route', e); return fallback(); });
  const idle: (cb: () => void) => void =
    'requestIdleCallback' in window ? (cb) => window.requestIdleCallback(cb, { timeout: 1500 }) : (cb) => setTimeout(cb, 400);
  if (document.readyState === 'complete') idle(go);
  else addEventListener('load', () => idle(go), { once: true });
}

function initPage(): void {
  ctx?.revert();
  activeLeg = 'gate';
  activeWpt = null;
  // pages without a flight plan (no gate) always park in cruise — never on the dawn sky
  parkedIdent = document.body.dataset.parked ?? (document.getElementById('gate') ? null : 'CRUISE');
  els = {
    mach: document.querySelector('[data-r="mach"]'),
    alt: document.querySelector('[data-r="alt"]'),
    wpt: document.querySelector('[data-r="wpt"]'),
    fill: document.querySelector('.readout__fill'),
    dawn: document.querySelector('.sky__dawn'),
    dusk: document.querySelector('.sky__dusk'),
  };
  setState({ parked: parkedIdent !== null, machBurst: false });
  if (reduced) document.querySelectorAll('.panel').forEach((p) => p.classList.add('is-docked'));

  ctx = gsap.context(() => {
    computeKeys();
    triggers();
    reveals();
    const board = document.querySelector<HTMLElement>('[data-flap]');
    if (board) flipBoard(board);
  });
  lenis?.resize();
  ScrollTrigger.refresh();
  update(ScrollTrigger.maxScroll(window) ? scrollY / ScrollTrigger.maxScroll(window) : 0);
  requestScene();
}

/* ─── hover: idents tick over (split-flap style), then settle ───────── */
const TICK = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function tickOver(el: HTMLElement): void {
  if (reduced || el.dataset.ticking) return;
  const final = el.dataset.final ?? el.textContent ?? '';
  el.dataset.final = final;
  el.dataset.ticking = '1';
  let step = 0;
  const id = setInterval(() => {
    step++;
    el.textContent = [...final].map((ch, i) => (i < (step / 8) * final.length ? ch : TICK[(i * 7 + step * 13) % TICK.length])).join('');
    if (step >= 8) {
      clearInterval(id);
      el.textContent = final;
      delete el.dataset.ticking;
    }
  }, 34);
}
const onHover = (e: Event) => {
  const host = (e.target as Element | null)?.closest?.('.panel, .case-list__item');
  const tick = host?.querySelector<HTMLElement>('[data-tick]');
  if (tick) tickOver(tick);
};
document.addEventListener('pointerover', onHover);
document.addEventListener('focusin', onHover);

initLenis();
document.addEventListener('astro:page-load', initPage);
document.addEventListener('astro:before-swap', () => {
  ctx?.revert();
  ctx = null;
});
