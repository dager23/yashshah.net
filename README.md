# yashshah.net

Personal site for Yash Shah. Static [Astro](https://astro.build) site, no client-side
JavaScript, self-hosted fonts, deployed on Vercel from `main`.

## Develop

```bash
npm install
npm run dev        # http://localhost:4321
```

| Script               | Does                                             |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Local dev server                                 |
| `npm run build`      | Production build to `dist/`, then the TODO guard |
| `npm run preview`    | Serve the built `dist/` locally                  |
| `npm run check`      | `astro check` — types and templates              |
| `npm run format`     | Prettier write                                   |
| `npm run gen:images` | Regenerate `public/og.png` and the favicons      |

## Add a project (case study)

1. Create `src/content/projects/<slug>.md`.
2. Frontmatter:

   ```yaml
   ---
   title: Project Name
   summary: One line, shown in lists.
   role: What you did.
   stack: [python, pytorch]
   repo: https://github.com/... # optional
   demo: https://... # optional
   date: 2024-05-01
   featured: true # show on the home page
   order: 1 # lower sorts first
   ---
   ```

3. Body uses this fixed structure (headings optional where you have nothing real to say):

   ```markdown
   ## Problem

   ## What I built

   ## Key decision or trade-off

   ## Result
   ```

That's it — the list page, the home page, and `/projects/<slug>` pick it up on the next build.

## Add a writing post

1. Create `src/content/writing/<slug>.md`.
2. Frontmatter: `title`, `description`, `pubDate: 2024-05-01`, `draft: true|false`.
3. While `draft: true` it is excluded from the site, the RSS feed, and the nav link.
   Flip to `false` to publish.

## Edit facts (bio, experience, links, honours)

Plain TypeScript in `src/data/`:

| File              | Holds                                                            |
| ----------------- | ---------------------------------------------------------------- |
| `site.ts`         | Name, tagline, location, links (LinkedIn, résumé, email, GitHub) |
| `experience.ts`   | Roles — company, title, dates, bullets                           |
| `publications.ts` | Papers and patents                                               |
| `achievements.ts` | Honours and awards                                               |
| `education.ts`    | Degree                                                           |
| `toolkit.ts`      | Languages / tools, grouped                                       |

Each link in `site.ts` has an `enabled` flag — set `email.enabled` to `true` once
`hi@yashshah.net` forwarding is live.

## Replace the résumé

Drop a new PDF at `public/resume.pdf`. No code change.

## Deploy

Push to `main`. Vercel auto-builds. Astro is auto-detected — no config needed.

## License

Code is [MIT](LICENSE). That covers the Astro setup, components, and styling —
not the personal content: Yash Shah's name, bio, résumé, case-study write-ups,
and likeness aren't yours to reuse just because the code is open.
