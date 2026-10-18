/**
 * The hangar — everything I've built that can actually be demonstrated, drawn as
 * ECAM system pages at /hangar.
 *
 * House rule for this file: every figure below is copied from the project's own
 * README, BENCHMARKS.md or package index — nothing is estimated, rounded up or
 * written from memory. `source` on a readout says where the number came from so
 * it can be re-checked later. If a claim can't be sourced, it doesn't go on the page.
 */

export type SystemState =
  | 'live' /** running somewhere a visitor can open right now */
  | 'published' /** shipped to a package index */
  | 'research' /** built and documented, not packaged */
  | 'in-build'; /** being worked on now */

export interface Readout {
  /** short mono label, ECAM-style */
  k: string;
  v: string;
  /** where the figure comes from — rendered as a footnote under the readouts */
  source?: string;
  /** amber = a caution the project itself raises, not a selling point */
  tone?: 'amber';
}

export interface SysLink {
  label: string;
  href: string;
  /** the one link worth pressing first */
  primary?: boolean;
}

export type Demo =
  /** a live page embedded on click (nothing loads until the visitor asks) */
  | { kind: 'embed'; url: string; poster: string; caption: string }
  /** screenshots that ship with the project */
  | { kind: 'shots'; shots: { file: string; caption: string }[]; caption: string }
  /** real terminal output, quoted verbatim from the project's README */
  | { kind: 'console'; lines: string[]; caption: string }
  /** no media — the synoptic carries it, with a caption to read it by */
  | { kind: 'synoptic'; caption: string };

export interface System {
  /** ECAM page ident — 6 characters or fewer, so the button row stays even */
  ident: string;
  slug: string;
  name: string;
  state: SystemState;
  /** one line: what it does, in a visitor's words rather than the repo's */
  summary: string;
  /** the problem, then the bet this project makes */
  body: string[];
  stack: string[];
  readouts: Readout[];
  links: SysLink[];
  demo: Demo;
}

const GH = 'https://github.com/dager23';

export const systems: System[] = [
  {
    ident: 'DOCROT',
    slug: 'docrot',
    name: 'docrot',
    state: 'published',
    summary: 'Finds the lines in your docs that your code stopped supporting.',
    body: [
      'Documentation rots quietly: a symbol is renamed, a path moves, a make target disappears, and the prose referencing it keeps claiming otherwise. Coding agents now read AGENTS.md and CLAUDE.md as ground truth on every run, so one stale path silently misdirects every session.',
      'docrot resolves every reference in your prose against the codebase using static analysis and git history — no LLM anywhere in the loop — and reports what no longer resolves, with the commit where the claim was written and the commit where it broke.',
    ],
    stack: ['Python', 'AST analysis', 'git history', 'CLI'],
    readouts: [
      { k: 'PKG', v: 'PyPI · docrot 0.1.0', source: 'pypi.org/project/docrot' },
      { k: 'PY', v: '3.10+', source: 'package metadata' },
      { k: 'LLM', v: 'none — deterministic', source: 'README' },
      {
        k: 'FIELD',
        v: 'found a documented class that has never existed, on its first run against httpx (~14k stars)',
        source: "the project's README",
      },
      {
        k: 'PRIOR',
        v: '28.9% of the top-1000 GitHub projects document a code element that no longer exists',
        source: 'DOCER, Empirical Software Engineering 2023 (arXiv 2212.01479), cited by the README',
      },
    ],
    links: [
      { label: 'pypi', href: 'https://pypi.org/project/docrot/', primary: true },
      { label: 'source', href: `${GH}/docrot` },
    ],
    demo: {
      kind: 'console',
      caption: "Real output, quoted from the project's README — its first run against httpx.",
      lines: [
        '$ docrot',
        'docs/advanced/transports.md:178:53  PY003 error  `httpx.Mounts` is documented but has never existed',
        '    written at 3faa4a8 (2024-02-14)',
        'docrot: 187 references | 82 resolved | 85 unknown (skipped) | 1 findings (1 error)',
      ],
    },
  },
  {
    ident: 'SEAMS',
    slug: 'seamgraph',
    name: 'seamgraph',
    state: 'published',
    summary: 'Maps the string-typed joins where full-stack repos actually break.',
    body: [
      'Every code-graph tool models code calling code: imports, symbols, call trees. But real breakages live in the seams between languages — a fetch path against a route decorator, an env var against a compose file, a template name against a file on disk. Those joins are strings, so no compiler checks them and no import graph sees them.',
      'seamgraph indexes seven kinds of seam deterministically and serves them to agents over MCP, so "what references this route?" is one call instead of a grep-storm.',
    ],
    stack: ['Python', 'MCP server', 'static indexing', 'git co-change'],
    readouts: [
      { k: 'PKG', v: 'PyPI · seamgraph 0.1.0', source: 'pypi.org/project/seamgraph' },
      {
        k: 'CORPUS',
        v: '20 real OSS repos — saleor, redash, cal.com, dify, label-studio and more',
        source: 'BENCHMARKS.md',
      },
      { k: 'INDEX', v: '118,520 files → 25,690 anchors → 16,048 seams', source: 'BENCHMARKS.md' },
      { k: 'KINDS', v: '7 seam kinds; 242 seams corroborated by git co-change', source: 'BENCHMARKS.md' },
      {
        k: 'TOKENS',
        v: '14.8× median reduction against grep-then-read-every-match',
        source: 'scripts/measure_token_story.py, counted byte for byte',
      },
    ],
    links: [
      { label: 'pypi', href: 'https://pypi.org/project/seamgraph/', primary: true },
      { label: 'source', href: `${GH}/seamgraph` },
      { label: 'benchmarks', href: `${GH}/seamgraph/blob/main/BENCHMARKS.md` },
    ],
    demo: {
      kind: 'synoptic',
      caption: 'The seven seam kinds, each one a string no compiler checks.',
    },
  },
  {
    ident: 'CTRACT',
    slug: 'repo-contract',
    name: 'repo-contract',
    state: 'published',
    summary: 'Machine-checkable rules an AI coding agent has to pass before it edits.',
    body: [
      'Agents generate good edits and bad boundaries: they refactor adjacent subsystems, import a database handler into a view controller, change behaviour without touching a test, or wander into .env. Asking them to understand the architecture does not reliably stop any of it.',
      'repo-contract takes the opposite approach — declare the negative constraints in YAML, validate the plan before the agent edits and the diff afterwards, and refuse deterministically with a reason a human can read.',
    ],
    stack: ['Python', 'YAML/TOML contracts', 'AST import resolution', 'MCP server'],
    readouts: [
      { k: 'PKG', v: 'PyPI · repo-contract 0.2.1', source: 'pypi.org/project/repo-contract' },
      { k: 'PY', v: '3.11+', source: 'package metadata' },
      { k: 'GATES', v: 'plan (pre-edit) and diff (post-edit)', source: 'README' },
      {
        k: 'CATCHES',
        v: 'forbidden imports · unsafe paths · missing tests · undeclared dependencies · unrelated refactors',
        source: "README's feature list",
      },
      { k: 'ENGINE', v: '100% deterministic, JSON-RPC output', source: 'README' },
    ],
    links: [
      { label: 'pypi', href: 'https://pypi.org/project/repo-contract/', primary: true },
      { label: 'source', href: `${GH}/RepoContract` },
    ],
    demo: {
      kind: 'synoptic',
      caption: 'What the engine refuses, and at which gate.',
    },
  },
  {
    ident: 'GUARD',
    slug: 'second-opinion',
    name: 'Second Opinion',
    state: 'in-build',
    summary: 'Listens to a suspicious call and interrupts the scam before the money moves.',
    body: [
      'Fake-police "digital arrest" scams work by isolating an older person and holding them on a call under manufactured authority. The decisive window is the few minutes before a transfer, and in that window the victim is alone.',
      'Second Opinion listens on speakerphone, recognises the coercion pattern rather than any particular script, warns the person calmly in English or Hindi, pulls in a family guardian, asks for a cool-off hold, and drafts the cybercrime complaint. There is no server — the browser talks to Gemini through Firebase AI Logic on the free plan.',
    ],
    stack: ['Gemini 3.8 Flash', 'Firebase AI Logic', 'AudioWorklet', 'Firestore', 'App Check'],
    readouts: [
      { k: 'BUILT FOR', v: 'AI Builder Cup 2026, Google Cloud JAPAC — Social Good', source: 'README' },
      { k: 'AUDIO', v: '16 kHz PCM in 8-second slices to Gemini Flash-Lite', source: "README's architecture graph" },
      { k: 'VISION', v: 'a frame check every 15 seconds for screen-share coercion', source: "README's architecture graph" },
      {
        k: 'LOSSES',
        v: 'India 2024 — ₹1,935 crore to digital-arrest scams across 1.23 lakh complaints',
        source: "the project's Impact page (shared/stats.json)",
      },
      {
        k: 'LOSSES',
        v: 'Japan 2025 — ¥142.3B to special fraud; people aged 65+ bore 59.2% of losses',
        source: "the project's Impact page (shared/stats.json)",
      },
    ],
    links: [{ label: 'source', href: `${GH}/second-opinion`, primary: true }],
    demo: {
      kind: 'shots',
      caption: 'Screenshots from the project itself.',
      shots: [
        { file: '01-guard-stop.png', caption: 'Call Guard interrupts mid-call with the pattern it recognised.' },
        { file: '03-scam-check.png', caption: 'Scam Check — paste a message or upload a screenshot for a verdict.' },
        { file: '07-guardian.png', caption: 'The guardian console on a family member’s phone.' },
        { file: '02-case-report.png', caption: 'The drafted cybercrime complaint, cited to official advisories.' },
      ],
    },
  },
  {
    ident: 'SIGNAL',
    slug: 'nse-bse-signals',
    name: 'NSE / BSE strategy signals',
    state: 'live',
    summary: 'Rule-based Nifty 50 baskets, recomputed every weekday after the close.',
    body: [
      'A backtesting study over 107,000+ strategy configurations, survivorship-corrected and replicated across independent data, left a handful of rules standing. This publishes what those surviving rules say today.',
      'GitHub Pages only serves static files, so the computation runs in GitHub Actions at 19:00 IST each weekday and the site displays its latest result. The panel below is that site, live.',
    ],
    stack: ['Python', 'GitHub Actions', 'static site', 'Flask (local)'],
    readouts: [
      {
        k: 'STUDY',
        v: '107k+ configurations, survivorship-corrected, replicated on independent data',
        source: 'README',
      },
      { k: 'SLEEVES', v: '6 — four monthly rank-based baskets, two event sleeves', source: "README's view table" },
      { k: 'CYCLE', v: 'regenerates 19:00 IST every weekday, and on demand', source: '.github/workflows/pages.yml' },
      {
        k: 'CAUTION',
        v: "Not investment advice. The honest point-in-time edge is modest — Sharpe ~0.5–0.8, drawdowns of 30–50% — and past results don't predict future returns.",
        source: "the project's own README disclaimer",
        tone: 'amber',
      },
    ],
    links: [
      { label: 'open the live site', href: 'https://dager23.github.io/nse-bse-signals/', primary: true },
      { label: 'source', href: `${GH}/nse-bse-signals` },
    ],
    demo: {
      kind: 'embed',
      url: 'https://dager23.github.io/nse-bse-signals/',
      poster: 'signals.png',
      caption: 'The live site, embedded. Nothing loads until you press it.',
    },
  },
  {
    ident: 'VSRCH',
    slug: 'vector-template-matching',
    name: 'Vector template matching',
    state: 'research',
    summary: 'Swaps a pixel-by-pixel template scan for nearest-neighbour search over embeddings.',
    body: [
      'Comparing a query image against a template set pixel by pixel costs more with every template you add. Encoding each template once as a feature-map embedding turns the same question into a nearest-neighbour lookup, which barely notices how large the set has grown.',
      'ResNet-101 extracts the feature maps, they go into Qdrant as vectors, and a query returns its ten closest matches.',
    ],
    stack: ['ResNet-101', 'Qdrant', 'vector search', 'PyTorch'],
    readouts: [
      { k: 'ENCODER', v: 'ResNet-101 feature maps → vectors', source: 'README' },
      { k: 'INDEX', v: 'Qdrant vector search engine', source: 'README' },
      { k: 'QUERY', v: 'returns the top 10 most similar images', source: 'README' },
    ],
    links: [{ label: 'source', href: `${GH}/Qdrant-Template-Matching`, primary: true }],
    demo: {
      kind: 'synoptic',
      caption: 'Where the cost goes when the template set grows.',
    },
  },
  {
    ident: 'FORGE',
    slug: 'forgery-detection',
    name: 'Forgery detection framework',
    state: 'research',
    summary: 'Four independent tests on one document, fused into a verdict and a heatmap.',
    body: [
      'No single signal catches a forged document: metadata can be stripped, compression artifacts can be hidden, and a clean-looking crop can still be missing a clause. So this runs four unrelated tests and fuses them.',
      'Metadata analysis, Error Level Analysis through a CNN with SRM-initialised high-pass filters, a two-stream RGB + DCT analyser that outputs a manipulation heatmap, and SSIM template matching against a ground truth to box what was added or removed.',
    ],
    stack: ['CNN', 'SRM high-pass filters', 'DCT / Fourier analysis', 'SSIM'],
    readouts: [
      { k: 'STAGE 1', v: 'metadata — ISO value, creation against modified timestamps (weighted 10/100)', source: 'README' },
      { k: 'STAGE 2', v: 'ELA — an SRM-initialised CNN as a dense patch descriptor, with feature fusion', source: 'README' },
      {
        k: 'STAGE 3',
        v: 'RGB + DCT two-stream analyser → manipulation heatmap, catches double compression',
        source: 'README',
      },
      { k: 'STAGE 4', v: 'SSIM against ground truth → bounding boxes on what changed', source: 'README' },
    ],
    links: [
      { label: 'read the case study', href: '/projects/docauth', primary: true },
      { label: 'source', href: `${GH}/Forgery-Detection` },
    ],
    demo: {
      kind: 'synoptic',
      caption: 'Four tests, four failure modes, one fused score.',
    },
  },
];

/** how each state prints on the status page and the page header */
export const stateLabel: Record<SystemState, string> = {
  live: 'LIVE',
  published: 'PUBLISHED',
  research: 'RESEARCH',
  'in-build': 'IN BUILD',
};
