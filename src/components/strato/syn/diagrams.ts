/**
 * The seven synoptics. Each one is drawn from that project's own README or
 * architecture notes — the boxes are the stages the code actually has, and the
 * figures are the ones the repo publishes. Nothing here is illustrative filler;
 * where a drawing shows a shape rather than a measurement (VSRCH's cost curve)
 * it says so on the face of the diagram.
 *
 * Each entry returns the SVG body plus a `desc`, which becomes the accessible
 * description of the drawing.
 */
import { box, chip, wire, label, heading, group, defs, rightOf, leftOf, topOf, botOf, type Box } from './parts';

export interface Synoptic {
  svg: string;
  desc: string;
}

const B = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

/* ── DOCROT ─────────────────────────────────────────────────────────────── */
function docrot(): Synoptic {
  const inputs = [
    { b: B(16, 70, 124, 24), t: 'README.md' },
    { b: B(16, 106, 124, 24), t: 'docs/*.md' },
    { b: B(16, 142, 124, 24), t: 'CLAUDE.md' },
  ];
  const ext = B(180, 82, 136, 66);
  const ast = B(356, 56, 140, 52);
  const git = B(356, 130, 140, 52);
  const verdicts = [
    { b: B(528, 56, 96, 24), t: 'resolved', tone: 'teal' as const },
    { b: B(528, 92, 96, 24), t: 'unknown', tone: 'dim' as const },
    { b: B(528, 128, 96, 24), t: 'finding', tone: 'amber' as const },
  ];
  const prov = B(428, 214, 196, 58);

  return {
    desc:
      'Prose files — README, docs and CLAUDE.md — feed a reference extractor that pulls out symbols, file paths and build targets. ' +
      'Each reference is checked twice: against the current tree by an AST resolver, and against git history for provenance. ' +
      'Every reference ends up resolved, skipped as unknown, or reported as a finding carrying the commit where the claim was written.',
    svg:
      defs() +
      heading(16, 28, 'DOC → CODE RESOLUTION') +
      inputs.map((i) => chip(i.b, i.t)).join('') +
      box(ext, 'reference extractor', { sub: ['symbols · file paths', 'make / tox / npm targets'] }) +
      box(ast, 'AST resolver', { sub: ['does it exist now?'] }) +
      box(git, 'git history', { sub: ['written when? broke when?'] }) +
      inputs.map((i) => wire(rightOf(i.b), leftOf(ext))).join('') +
      wire(rightOf(ext), leftOf(ast), { tone: 'instr', flow: true }) +
      wire(rightOf(ext), leftOf(git), { tone: 'instr' }) +
      verdicts.map((v) => chip(v.b, v.t, v.tone)).join('') +
      wire(rightOf(ast), leftOf(verdicts[0].b), { tone: 'teal' }) +
      wire(rightOf(ast), leftOf(verdicts[1].b), { tone: 'dim' }) +
      wire(rightOf(ast), leftOf(verdicts[2].b), { tone: 'amber', flow: true }) +
      box(prov, 'provenance on every finding', {
        tone: 'amber',
        sub: ['written at 3faa4a8 (2024-02-14)', 'and the commit where it broke'],
        mono: false,
      }) +
      wire(botOf(verdicts[2].b), topOf(prov), { tone: 'amber', bend: 'v' }) +
      wire(botOf(git), leftOf(prov), { tone: 'dim', bend: 'v' }) +
      label(16, 306, 'NO LLM IN THE LOOP — STATIC ANALYSIS AND GIT HISTORY ONLY', { tone: 'instr' }) +
      label(16, 326, 'UNKNOWN REFERENCES ARE SKIPPED, NOT GUESSED AT', { tone: 'dim' }),
  };
}

/* ── SEAMS ──────────────────────────────────────────────────────────────── */
function seamgraph(): Synoptic {
  const kinds: [string, string, string][] = [
    ['ROUTE', 'fetch("/api/users/" + id)', '@app.get("/api/users/{user_id}")'],
    ['ENV', 'process.env.STRIPE_KEY', '.env · compose · Dockerfile · CI'],
    ['TMPL', 'render_template("checkout.html")', 'templates/checkout.html'],
    ['URL', "{% url 'order-detail' %}", 'path(…, name="order-detail")'],
    ['TASK', 'send_task("app.tasks.send_email")', '@shared_task(name=…)'],
    ['SCRIPT', 'CI run: make build', 'Makefile target build:'],
    ['SETTING', 'settings.STRIPE_API_KEY', 'STRIPE_API_KEY = … in settings.py'],
  ];
  const rows = kinds
    .map(([kind, code, cfg], i) => {
      const y = 84 + i * 26;
      const left = B(74, y, 230, 19);
      const right = B(360, y, 264, 19);
      return (
        label(16, y + 13, kind, { tone: 'amber' }) +
        chip(left, code, 'instr') +
        chip(right, cfg, 'dim') +
        wire(rightOf(left), leftOf(right), { tone: i === 0 ? 'instr' : 'dim', flow: i === 0, bend: 'none' })
      );
    })
    .join('');

  const sum = B(16, 278, 608, 52);
  return {
    desc:
      'Seven kinds of string-typed seam, each joining a call site in code to a declaration in config, templates, CI or settings: ' +
      'route, env var, template, URL name, task, script and setting. ' +
      'Indexed across twenty real open-source repositories: 118,520 files produce 25,690 anchors and 16,048 seams, ' +
      'answering a reference query with a median of 14.8 times less context than grepping and reading every match.',
    svg:
      defs() +
      heading(16, 28, 'STRING-TYPED SEAMS — THE JOINS NO COMPILER CHECKS') +
      heading(74, 68, 'CODE SIDE') +
      heading(360, 68, 'CONFIG · INFRA · TEMPLATE SIDE') +
      rows +
      group(sum, 'MEASURED OVER 20 REAL OSS REPOS', 'instr') +
      label(32, 310, '118,520 FILES', { tone: 'instr' }) +
      label(170, 310, '25,690 ANCHORS', { tone: 'instr' }) +
      label(312, 310, '16,048 SEAMS', { tone: 'instr' }) +
      label(448, 310, '14.8× LESS CONTEXT', { tone: 'amber' }),
  };
}

/* ── CTRACT ─────────────────────────────────────────────────────────────── */
function repoContract(): Synoptic {
  const plan = B(176, 54, 288, 26);
  const g1 = B(120, 96, 400, 58);
  const edits = B(176, 172, 288, 26);
  const g2 = B(120, 214, 400, 66);
  const merge = B(176, 298, 288, 26);
  const refuse = B(536, 140, 88, 92);

  return {
    desc:
      'An agent proposes a plan, which the plan gate checks before any file is touched — planned paths against safety boundaries, ' +
      'and scope against file-count limits. The agent then edits, and the diff gate checks the patch before it lands: forbidden imports, ' +
      'missing tests, undeclared dependencies and refactors spanning unrelated modules. Either gate can refuse, deterministically and with a reason.',
    svg:
      defs() +
      heading(16, 28, 'TWO GATES AROUND THE AGENT') +
      chip(plan, 'agent proposes a plan', 'dim') +
      box(g1, 'PLAN GATE — before any file is touched', {
        sub: ['planned paths vs safety boundaries · scope and file-count limits'],
        mono: false,
      }) +
      chip(edits, 'agent edits the code', 'dim') +
      box(g2, 'DIFF GATE — before the patch lands', {
        sub: ['forbidden imports · missing tests', 'undeclared dependencies · unrelated refactors'],
        mono: false,
      }) +
      chip(merge, 'merge', 'teal') +
      wire(botOf(plan), topOf(g1), { tone: 'instr', bend: 'v', flow: true }) +
      wire(botOf(g1), topOf(edits), { tone: 'instr', bend: 'v' }) +
      wire(botOf(edits), topOf(g2), { tone: 'instr', bend: 'v' }) +
      wire(botOf(g2), topOf(merge), { tone: 'teal', bend: 'v' }) +
      box(refuse, 'REFUSED', { tone: 'amber', sub: ['with a reason', 'you can read'] }) +
      wire(rightOf(g1), [refuse.x, refuse.y + 24], { tone: 'amber' }) +
      wire(rightOf(g2), [refuse.x, refuse.y + 68], { tone: 'amber' }) +
      label(16, 346, 'THE SAME VALIDATORS ARE EXPOSED TO AGENTS OVER MCP · 100% DETERMINISTIC', { tone: 'instr' }),
  };
}

/* ── GUARD ──────────────────────────────────────────────────────────────── */
function secondOpinion(): Synoptic {
  const mic = B(16, 106, 170, 28);
  const frame = B(212, 44, 180, 36);
  const work = B(212, 96, 180, 48);
  const gem = B(418, 96, 206, 48);
  const alert = B(418, 172, 206, 46);
  const agent = B(212, 172, 180, 46);
  const store = B(16, 172, 170, 46);
  const guardian = B(16, 252, 170, 46);
  const report = B(212, 252, 180, 46);
  const advis = B(418, 252, 206, 46);

  return {
    desc:
      'Audio from a speakerphone or a shared meeting tab is captured by an AudioWorklet as 16 kHz PCM and sent to Gemini Flash-Lite in eight-second slices, ' +
      'where a classifier looks for the coercion pattern rather than any particular script. A video frame is checked every fifteen seconds. ' +
      'A detection raises an alert carrying signals, quotes and a whisper, which the Case Agent turns into Firestore state: the session, a cool-off hold, ' +
      'and a drafted cybercrime complaint cited to official advisories, with a guardian console on a family member’s phone able to approve the hold.',
    svg:
      defs() +
      heading(16, 28, 'CALL GUARD — SIGNAL PATH') +
      chip(mic, 'speakerphone / Meet tab', 'dim') +
      box(frame, 'frame check · every 15 s', { sub: ['screen-share coercion'] }) +
      box(work, 'AudioWorklet', { sub: ['16 kHz PCM, 8 s slices'] }) +
      box(gem, 'Gemini Flash-Lite', { sub: ['coercion pattern, not script'] }) +
      box(alert, 'raise_alert', { tone: 'amber', sub: ['signals · quotes · whisper'] }) +
      box(agent, 'Case Agent', { sub: ['function calling'] }) +
      box(store, 'Firestore', { sub: ['session · alerts · hold'] }) +
      box(guardian, 'guardian console', { tone: 'teal', sub: ['approve the hold'] }) +
      box(report, 'cybercrime complaint', { sub: ['drafted, with citations'] }) +
      box(advis, 'official advisories', { sub: ['cited in the report'] }) +
      wire(rightOf(mic), leftOf(work), { tone: 'instr', flow: true, bend: 'none' }) +
      wire(rightOf(mic), leftOf(frame), { tone: 'dim' }) +
      wire(rightOf(work), leftOf(gem), { tone: 'instr', flow: true, bend: 'none' }) +
      wire(botOf(gem), topOf(alert), { tone: 'amber', bend: 'v', flow: true }) +
      wire(botOf(frame), [gem.x + 20, gem.y], { tone: 'dim' }) +
      wire(leftOf(alert), rightOf(agent), { tone: 'amber', bend: 'none' }) +
      wire(leftOf(agent), rightOf(store), { tone: 'instr', bend: 'none' }) +
      wire(botOf(store), topOf(guardian), { tone: 'teal', bend: 'v' }) +
      wire(botOf(agent), topOf(report), { tone: 'instr', bend: 'v' }) +
      wire(rightOf(report), leftOf(advis), { tone: 'dim', bend: 'none' }) +
      label(16, 336, 'NO SERVER — THE BROWSER TALKS TO GEMINI THROUGH FIREBASE AI LOGIC, ON THE FREE PLAN', {
        tone: 'instr',
      }),
  };
}

/* ── SIGNAL ─────────────────────────────────────────────────────────────── */
function signals(): Synoptic {
  const cron = B(16, 66, 196, 26);
  const manual = B(16, 102, 196, 26);
  const actions = B(240, 58, 164, 78);
  const pages = B(432, 58, 192, 78);
  const sleeves = B(16, 158, 608, 100);
  const monthly = ['champion blend', 'low-vol + reversal', 'momentum + crash guard', 'volume-weighted'];
  const events = ['volume spike + inside day', 'deep-oversold RSI'];
  const combined = B(16, 274, 384, 44);
  const caution = B(412, 274, 212, 44);

  return {
    desc:
      'A scheduled GitHub Actions run at 19:00 IST each weekday, or a manual run, executes the signal engine and publishes a static site to GitHub Pages — there is no server. ' +
      'Six sleeves feed it: four monthly rank-based baskets and two event sleeves, merged into one combined portfolio with a capital calculator. ' +
      'The project states plainly that this is not investment advice: Sharpe around 0.5 to 0.8 with drawdowns of 30 to 50 percent.',
    svg:
      defs() +
      heading(16, 28, 'WEEKDAY CYCLE') +
      chip(cron, 'cron · 19:00 IST, weekdays', 'instr') +
      chip(manual, 'manual run', 'dim') +
      box(actions, 'GitHub Actions', { sub: ['build_site.py', 'engine + market data'] }) +
      box(pages, 'static site on Pages', { tone: 'teal', sub: ['no server to run', 'NSE / BSE price toggle'] }) +
      wire(rightOf(cron), leftOf(actions), { tone: 'instr', flow: true }) +
      wire(rightOf(manual), leftOf(actions), { tone: 'dim' }) +
      wire(rightOf(actions), leftOf(pages), { tone: 'instr', flow: true, bend: 'none' }) +
      group(sleeves, 'SIX SLEEVES', 'instr') +
      monthly.map((m, i) => chip(B(26 + i * 150, 188, 142, 22), m, 'instr')).join('') +
      events.map((e, i) => chip(B(26 + i * 300, 222, 292, 22), e, 'amber')).join('') +
      label(26, 252, 'FOUR MONTHLY RANK-BASED BASKETS · TWO EVENT SLEEVES', { tone: 'dim' }) +
      box(combined, 'combined portfolio + capital calculator', { mono: false }) +
      box(caution, 'NOT INVESTMENT ADVICE', { tone: 'amber', sub: ['Sharpe ~0.5–0.8 · DD 30–50%'] }) +
      wire(botOf(sleeves), topOf(combined), { tone: 'instr', bend: 'v' }),
  };
}

/* ── VSRCH ──────────────────────────────────────────────────────────────── */
function vsearch(): Synoptic {
  const q = B(16, 58, 124, 26);
  const net = B(164, 46, 140, 50);
  const vec = B(332, 46, 104, 50);
  const qd = B(464, 46, 160, 50);
  const top = B(464, 116, 160, 26);
  const plot = B(16, 158, 608, 162);
  // chart frame inside the group
  const x0 = 76;
  const x1 = 600;
  const yb = 288;
  const yt = 190;

  return {
    desc:
      'A query image is encoded by ResNet-101 into feature maps, flattened to a vector, and matched in Qdrant, which returns the ten nearest templates. ' +
      'The lower panel is a schematic of why: a pixel-by-pixel scan does work proportional to the number of templates, while an embedding lookup stays close to flat as the set grows. ' +
      'It shows the shape of the two curves, not measured timings.',
    svg:
      defs() +
      heading(16, 28, 'QUERY PATH') +
      chip(q, 'query image', 'dim') +
      box(net, 'ResNet-101', { sub: ['feature maps'] }) +
      box(vec, 'vector', { sub: ['one per template'] }) +
      box(qd, 'Qdrant', { sub: ['nearest neighbours'] }) +
      chip(top, 'top 10 matches', 'teal') +
      wire(rightOf(q), leftOf(net), { tone: 'instr', flow: true, bend: 'none' }) +
      wire(rightOf(net), leftOf(vec), { tone: 'instr', bend: 'none' }) +
      wire(rightOf(vec), leftOf(qd), { tone: 'instr', flow: true, bend: 'none' }) +
      wire(botOf(qd), topOf(top), { tone: 'teal', bend: 'v' }) +
      group(plot, 'WORK PER QUERY AS THE TEMPLATE SET GROWS', 'dim') +
      `<path class="syn-axis" d="M${x0} ${yt} V${yb} H${x1}" />` +
      `<path class="syn-curve syn--amber" d="M${x0} ${yb - 6} L${x1} ${yt + 4}" />` +
      `<path class="syn-curve syn--teal" d="M${x0} ${yb - 10} C${x0 + 180} ${yb - 20} ${x1 - 200} ${yb - 26} ${x1} ${yb - 30}" />` +
      label(x1, yt + 16, 'pixel-by-pixel: every template, every query', { anchor: 'end', tone: 'amber' }) +
      label(x1, yb - 38, 'embedding + nearest-neighbour lookup', { anchor: 'end', tone: 'teal' }) +
      label(x0 - 8, yt + 6, 'work', { anchor: 'end', tone: 'dim' }) +
      label(x1, yb + 18, 'templates →', { anchor: 'end', tone: 'dim' }) +
      label(x0, yb + 18, 'SHAPE, NOT MEASUREMENTS', { tone: 'dim' }),
  };
}

/* ── FORGE ──────────────────────────────────────────────────────────────── */
function forgery(): Synoptic {
  const doc = B(240, 52, 160, 42);
  const tests: [Box, string, string[]][] = [
    [B(16, 124, 146, 80), 'metadata', ['ISO · timestamps', 'weighted 10/100']],
    [B(178, 124, 146, 80), 'Error Level Analysis', ['SRM high-pass CNN', 'dense patch descriptor']],
    [B(340, 124, 146, 80), 'RGB + DCT streams', ['double compression', 'pixel heatmap']],
    [B(502, 124, 122, 80), 'SSIM', ['vs ground truth', 'boxes what moved']],
  ];
  const fuse = B(16, 240, 424, 48);
  const out = B(456, 240, 168, 48);

  return {
    desc:
      'One document is put through four unrelated tests at once: metadata analysis of ISO value and timestamps, weighted ten out of a hundred; ' +
      'Error Level Analysis through a CNN initialised with SRM high-pass filters acting as a dense patch descriptor; ' +
      'a two-stream RGB and DCT analyser that catches double compression and produces a pixel heatmap; ' +
      'and SSIM template matching against a ground truth that boxes what was added or removed. Their features are fused into a single real-or-fake verdict with a confidence.',
    svg:
      defs() +
      heading(16, 28, 'FOUR TESTS, ONE VERDICT') +
      box(doc, 'document under test', { tone: 'dim', mono: false }) +
      tests.map(([b, t, sub]) => box(b, t, { sub })).join('') +
      tests.map(([b]) => wire(botOf(doc), topOf(b), { tone: 'instr', bend: 'v' })).join('') +
      box(fuse, 'feature fusion → real / fake, with a confidence', { mono: false }) +
      box(out, 'manipulation heatmap', { tone: 'amber', sub: ['+ bounding boxes'] }) +
      tests.map(([b]) => wire(botOf(b), [b.x + b.w / 2, fuse.y], { tone: 'dim', bend: 'v' })).join('') +
      wire(rightOf(fuse), leftOf(out), { tone: 'amber', bend: 'none' }) +
      label(16, 318, 'NO SINGLE SIGNAL IS TRUSTED — EACH TEST FAILS DIFFERENTLY', { tone: 'instr' }),
  };
}

export const synoptics: Record<string, Synoptic> = {
  docrot: docrot(),
  seamgraph: seamgraph(),
  'repo-contract': repoContract(),
  'second-opinion': secondOpinion(),
  'nse-bse-signals': signals(),
  'vector-template-matching': vsearch(),
  'forgery-detection': forgery(),
};
