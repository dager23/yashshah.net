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
const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
const root = document.documentElement;
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
    dawn0: at('[data-leg="takeoff"]', 'top', 0.2, 0.05), // the cockpit has cleared: fly into the dawn first
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

  const dawn = st.parked ? 0 : 1 - smooth(keys.dawn0, keys.dawn1, p);
  const dusk = st.parked ? 0 : smooth(keys.dusk0, keys.dusk1, p);
  if (els.dawn) els.dawn.style.opacity = String(dawn);
  if (els.dusk) els.dusk.style.opacity = String(dusk);
  // the glass chrome tints with the sky (strato-live.css)
  root.style.setProperty('--dawn', dawn.toFixed(3));
  root.style.setProperty('--dusk', dusk.toFixed(3));

  odo(els.mach, mach(p).toFixed(2));
  const alt = Math.round(altitude(p) / 100) * 100;
  odo(els.alt, `${String(alt).padStart(5, '0').replace(/(\d{2})(\d{3})$/, '$1,$2')} FT`);
  if (els.wpt) els.wpt.textContent = st.parked ? parkedIdent ?? 'CRUISE' : activeWpt ?? legLabel[activeLeg] ?? 'GATE';
  if (els.fill) els.fill.style.transform = `scaleX(${p.toFixed(4)})`;

  if (!st.parked && !reduced && !st.machBurst && p >= keys.mach1 && p < keys.descent) {
    setState({ machBurst: true });
    els.mach?.classList.add('is-amber');
    setTimeout(() => els.mach?.classList.remove('is-amber'), 1600);
    sonicBoom();
  }
}

/* ─── Mach 1: one shock line sweeps the viewport (styles in strato-live.css) ── */
function sonicBoom(): void {
  const el = document.createElement('div');
  el.className = 'shock';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

/* ─── gate: push through the windscreen; the readout undocks as the deck clears ─── */
function pushThrough(): void {
  const gate = document.getElementById('gate');
  const readout = document.getElementById('readout');
  const stow = (on: boolean) => {
    readout?.classList.toggle('is-stowed', on);
  };
  stow(gate !== null); // the persisted readout must reappear on pages without a gate
  if (!gate) return;
  const range = { trigger: gate, start: 'top top', end: 'bottom top' };
  ScrollTrigger.create({
    ...range,
    onUpdate: (self) => stow(self.progress < 0.5),
    onRefresh: (self) => stow(self.progress < 0.5),
  });
  if (reduced) return; // the cockpit simply scrolls away
  // clears by 65% of the gate, before liftoff and the dawn → cruise cross-fade (computeKeys)
  const q = gsap.utils.selector(gate);
  gsap
    .timeline({ defaults: { ease: 'none' }, scrollTrigger: { ...range, scrub: true, invalidateOnRefresh: true } })
    .to(q('.deck__stage'), { y: () => gate.offsetHeight, duration: 1 }, 0) // hold the cockpit still while the page scrolls
    .to(q('.deck__hud, .deck__screen'), { autoAlpha: 0, duration: 0.25 }, 0)
    .to(q('.deck__frame'), { scale: 2.6, ease: 'power2.in', duration: 0.6 }, 0)
    .to(q('.deck__view'), { yPercent: 16, scale: 1.2, ease: 'power1.in', duration: 0.55 }, 0.05) // nose up: the horizon drops
    .to(q('.deck__stage'), { autoAlpha: 0, duration: 0.3 }, 0.35);
}

/* ─── gate: the HUD boots — readouts settle character by character, the plan draws itself ─── */
function bootHud(): void {
  const spans = document.querySelectorAll<HTMLElement>('[data-boot]');
  const plans = document.querySelectorAll<Element>('.deck__route');
  if (reduced || !spans.length) { plans.forEach((p) => p.classList.add('is-drawn')); return; }
  const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const STEPS = 14;
  spans.forEach((el, i) => {
    const final = el.dataset.boot ?? '';
    let step = 0;
    setTimeout(() => {
      const id = setInterval(() => {
        step++;
        el.textContent = [...final]
          .map((ch, j) => (/[A-Z0-9]/.test(ch) && j > (step / STEPS) * final.length ? CH[(j * 7 + step * 13) % CH.length] : ch))
          .join('');
        if (step >= STEPS) { clearInterval(id); el.textContent = final; }
      }, 45);
    }, 350 + (i % 3) * 180); // wide and tall stages carry the same readouts; stagger within a block
  });
  setTimeout(() => plans.forEach((p) => p.classList.add('is-drawn')), 900);
}

/* ─── header: a liquid pill slides under the nav item you're over ─────── */
function navPill(): void {
  const nav = document.querySelector<HTMLElement>('.hdr nav');
  const pill = nav?.querySelector<HTMLElement>('.hdr__pill');
  if (!nav || !pill || !canHover) return;
  nav.addEventListener('pointerover', (e) => {
    const a = (e.target as Element).closest('a');
    if (!a) return;
    pill.style.left = `${a.offsetLeft - 10}px`;
    pill.style.width = `${a.offsetWidth + 20}px`;
    pill.classList.add('is-on');
  });
  nav.addEventListener('pointerleave', () => pill.classList.remove('is-on'));
}

/* ─── flight log ↔ route map: the leg into each role's city lights as you pass it,
   and the marker flies it ─── */
function logSync(): void {
  const map = document.querySelector('.routemap');
  if (!map) return;
  const plane = map.querySelector<SVGGElement>('.route-plane');
  const light = (entry: HTMLElement) => {
    const code = entry.dataset.code;
    document.querySelectorAll('.entry.is-here, .routemap .is-active').forEach((el) => el.classList.remove('is-here', 'is-active'));
    entry.classList.add('is-here');
    map.querySelectorAll(`[data-code="${code}"], [data-to="${code}"]`).forEach((el) => el.classList.add('is-active'));
    const arc = map.querySelector<SVGPathElement>(`.route-arc[data-to="${code}"]`);
    if (plane && arc && !reduced) {
      plane.style.offsetPath = `path("${arc.getAttribute('d')}")`;
      plane.classList.remove('is-flying');
      plane.getBoundingClientRect(); // restart the animation
      plane.classList.add('is-flying');
    }
  };
  document.querySelectorAll<HTMLElement>('.entry[data-code]').forEach((el) => {
    ScrollTrigger.create({
      trigger: el, start: 'top 62%', end: 'bottom 38%',
      onToggle: (self) => { if (self.isActive) light(el); },
    });
  });
}

/* ─── clearances: each honour is stamped onto the page once ──────────── */
function stamps(): void {
  document.querySelectorAll<HTMLElement>('.stamp').forEach((el, i) => {
    if (reduced) { el.classList.add('is-stamped'); return; }
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => setTimeout(() => el.classList.add('is-stamped'), (i % 4) * 90), // a row lands left to right
    });
  });
}

/* ─── liquid glass: the specular highlight follows the pointer; the pass tilts ─── */
let chrome: HTMLElement[] = [];
let px = 0, py = 0, sheenRaf = 0;
function sheen(): void {
  sheenRaf = 0;
  for (const el of chrome) {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${(((px - r.left) / r.width) * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(((py - r.top) / r.height) * 100).toFixed(1)}%`);
  }
}
if (canHover) {
  document.addEventListener('pointermove', (e) => {
    px = e.clientX; py = e.clientY;
    if (!sheenRaf) sheenRaf = requestAnimationFrame(sheen);
  }, { passive: true });
}
function passTilt(): void {
  const pass = document.querySelector<HTMLElement>('.pass');
  if (!pass || !canHover || reduced) return;
  pass.addEventListener('pointermove', (e) => {
    const r = pass.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    pass.style.setProperty('--ry', `${(x * 14).toFixed(2)}deg`);
    pass.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`);
    pass.style.setProperty('--sx', (x + 0.5).toFixed(3));
  });
  pass.addEventListener('pointerleave', () => {
    pass.style.removeProperty('--rx');
    pass.style.removeProperty('--ry');
  });
}

/* ─── masked line reveals, once each ─────────────────────────────────── */
function reveals(): void {
  if (reduced) return;
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      aria: 'none', // no aria-label on <p> (prohibited); the split text keeps its reading order
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
  // Poster: the 0.9 KB 2D route marker flies at once. WebGL takes over on the first
  // interaction, so the three.js boot never competes with the hero's first paint.
  const poster = import('./fallback2d').then((f) => f.startFallback());
  const EVENTS = ['pointerdown', 'wheel', 'touchstart', 'keydown', 'scroll'] as const;
  let started = false;
  const go = () => {
    if (started) return;
    started = true;
    EVENTS.forEach((ev) => removeEventListener(ev, go));
    import('./scene')
      .then((m) => { if (m.startScene(canvas)) poster.then((stop) => stop()); }) // no WebGL: the poster keeps flying
      .catch((e) => console.warn('WebGL scene unavailable — staying on the 2D route', e));
  };
  EVENTS.forEach((ev) => addEventListener(ev, go, { passive: true }));
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
  chrome = [...document.querySelectorAll<HTMLElement>('.hdr, .readout')];
  setState({ parked: parkedIdent !== null, machBurst: false });
  if (reduced) document.querySelectorAll('.panel').forEach((p) => p.classList.add('is-docked'));

  ctx = gsap.context(() => {
    computeKeys();
    triggers();
    reveals();
    pushThrough();
    logSync();
    stamps();
  });
  passTilt();
  navPill();
  bootHud();
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
