/**
 * The ECAM page cycle on /hangar.
 *
 * One owner for the whole display: the control row, the status table's links,
 * the keyboard, and the two demo widgets (click-to-load embed, screenshot
 * switcher). Links inside the display carry data-ecam-link so the site-wide
 * anchor handler in flight.ts leaves them alone — see the note there.
 *
 * Everything degrades: with no JavaScript the pages are stacked and the table's
 * links are plain in-page anchors, which is why nothing here is required for the
 * content to be readable.
 */

function mount(): void {
  const root = document.querySelector<HTMLElement>('[data-ecam]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';

  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-sys]')];
  const panels = new Map<string, HTMLElement>();
  for (const t of tabs) {
    const p = root.querySelector<HTMLElement>(`#sys-${CSS.escape(t.dataset.sys ?? '')}`);
    if (p) panels.set(t.dataset.sys!, p);
  }
  if (!tabs.length) return;

  function show(slug: string, opts: { focus?: boolean; hash?: boolean } = {}): void {
    if (!panels.has(slug)) return;
    for (const t of tabs) {
      const on = t.dataset.sys === slug;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on && opts.focus) t.focus();
    }
    for (const [s, p] of panels) p.classList.toggle('is-on', s === slug);

    if (opts.hash !== false) {
      const h = `#sys-${slug}`;
      if (location.hash !== h) history.replaceState(history.state, '', h);
    }
    // switching to a shorter page can leave the display above the fold
    const top = root!.getBoundingClientRect().top;
    if (top < 0) scrollTo({ top: scrollY + top - 80 });
  }

  for (const t of tabs) {
    t.addEventListener('click', () => show(t.dataset.sys!));
  }

  // ← → between pages, Home / End to the ends: the ARIA tabs pattern
  root.querySelector('[role="tablist"]')?.addEventListener('keydown', (e) => {
    const k = (e as KeyboardEvent).key;
    const i = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    const next =
      k === 'ArrowRight' ? (i + 1) % tabs.length
      : k === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length
      : k === 'Home' ? 0
      : k === 'End' ? tabs.length - 1
      : -1;
    if (next < 0) return;
    e.preventDefault();
    show(tabs[next].dataset.sys!, { focus: true });
  });

  // the status table jumps to a system instead of scrolling to a hidden panel
  for (const a of root.querySelectorAll<HTMLAnchorElement>('[data-ecam-link]')) {
    a.addEventListener('click', (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      show(a.dataset.ecamLink!, { focus: true });
    });
  }

  // click-to-load: nothing from the embedded origin is fetched until asked
  for (const btn of root.querySelectorAll<HTMLButtonElement>('[data-embed]')) {
    btn.addEventListener('click', () => {
      const host = btn.closest<HTMLElement>('[data-embed-host]');
      if (!host) return;
      const frame = document.createElement('iframe');
      frame.src = btn.dataset.embed!;
      frame.loading = 'lazy';
      frame.title = btn.getAttribute('aria-label') ?? 'Live demo';
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
      frame.setAttribute('referrerpolicy', 'no-referrer');
      host.replaceChildren(frame);
    });
  }

  // screenshot switcher
  for (const group of root.querySelectorAll<HTMLElement>('[data-shots]')) {
    const figures = [...group.querySelectorAll<HTMLElement>('[data-shot-i]')];
    const thumbs = [...group.querySelectorAll<HTMLButtonElement>('[data-thumb]')];
    const cap = group.closest('.ecam__pg')?.querySelector<HTMLElement>('[data-shot-cap]');
    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const i = Number(thumb.dataset.thumb);
        figures.forEach((f) => (f.hidden = Number(f.dataset.shotI) !== i));
        thumbs.forEach((t) => t.setAttribute('aria-current', t === thumb ? 'true' : 'false'));
        if (cap) cap.textContent = thumb.title;
      });
    });
  }

  // arriving on /hangar#sys-seamgraph should open that page, not scroll to it
  const want = location.hash.replace(/^#sys-/, '');
  if (want && panels.has(want)) show(want, { hash: false });
}

mount();
document.addEventListener('astro:page-load', mount);
