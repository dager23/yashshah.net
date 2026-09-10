Portfolio site for yashshah.net: build plan
Context
Owner: Yash Shah, software engineer at NetApp, Bangalore.
Domain: yashshah.net, registered at Spaceship through 2031. DNS is managed in Spaceship's Domain Manager.
Hosting: Vercel (free Hobby plan), deployed from a GitHub repo.
Audience: recruiters and engineering hiring managers who skim quickly on phones and laptops.
Goal: a fast, credible, easy-to-update personal site showing who I am, what I've built, and how to reach me.
Ground rules for Claude Code
Work one phase at a time. At the end of each phase, summarize what changed and what I should check, then stop and wait for my approval.
Never invent content. No made-up projects, metrics, employers, dates, or testimonials. Where content is missing, use a clearly marked placeholder that starts with TODO:.
Keep dependencies minimal. The site should be static, with no client-side JavaScript unless a specific feature needs it.
Check the current official docs for setup commands (Astro, Vercel) instead of relying on memory, since versions change.
Commit at the end of every phase with a clear message.
Steps marked [MANUAL] need me in a browser. List them for me; don't try to do them.
Phase 0 [MANUAL]: Before starting
In Spaceship, turn on 2FA, confirm the transfer lock and privacy protection are on, and add a calendar reminder a month before the 2031 expiry.
Create GitHub and Vercel accounts (sign in to Vercel with GitHub).
Install Node.js LTS and git.
Start gathering the content in the checklist at the bottom.
Phase 1: Scaffold
Create an Astro project with TypeScript in strict mode, starting from the minimal template.
Use plain CSS with custom properties (design tokens) and Astro's scoped styles. No CSS framework.
Set site: 'https://yashshah.net' in the Astro config.
Add Prettier with the Astro plugin, and dev, build, preview, check (astro check) and format scripts.
Add a .gitignore and a README.
Initialize git and make the first commit.
If the GitHub CLI is installed and logged in, create a public repo named yashshah.net and push to it. Otherwise, give me the exact commands to run.
Phase 2: Content model
src/data/site.ts: name, one-line tagline, email (hi@yashshah.net), social links (GitHub, LinkedIn), and the resume path (/resume.pdf).
src/data/experience.ts: an array of roles with company, title, dates, and 2–4 impact bullets each.
Content collection projects (Markdown with Zod schema):
Fields: title, summary (one line), role, stack (string[]), repo and demo (both optional URLs), date, featured (boolean), order (number), cover (optional image).
Body follows a fixed case-study structure: Problem → What I built → Key decision or trade-off → Result.
Content collection writing: title, description, pubDate, draft (boolean).
Seed one example project and one draft post, both marked with TODO:.
Phase 3: Pages
/ (home):
Intro with name, pitch, and links to GitHub, LinkedIn, email, and resume.
Featured projects (3–4).
Experience.
Latest writing, hidden when there are no published posts.
/projects and /projects/[slug]: the list and the case-study pages.
/writing and /writing/[slug], plus an RSS feed. Hide the nav link until at least one post is published.
/resume.pdf: a static file in public/.
Custom 404 page.
Contact: a mailto: link. No contact form.
Phase 4: Design
Use a two-pass process.
Propose before building:
4–6 named hex colors.
1–2 deliberately chosen typefaces and a type scale.
An ASCII wireframe of the home page with alignment notes.
A short list of principles, including which single element will be the memorable one.
Check the proposal against the defaults below, revise anything generic, and wait for my approval.
Build it, then review with screenshots if the environment supports it.
Avoid template tells:
Gradient blobs and decorative glows.
Grids of identical cards with the same shadow.
Skill bars or percentages.
Fade-in animations on every section.
ALL-CAPS eyebrow labels above headings.
Emoji headings.
Numbered markers on content that isn't a sequence.
Quality floor:
Responsive down to 360px.
Visible keyboard focus.
Respect prefers-reduced-motion.
WCAG AA contrast.
Light and dark themes via prefers-color-scheme.
Self-hosted fonts (no third-party font requests).
Line length under ~75 characters.
Phase 5: SEO and polish
Per-page metadata: title, description, canonical URL, and Open Graph and Twitter tags.
Default Open Graph image: a static 1200×630 image in the site's style.
Discovery files:
A favicon set.
A sitemap via the official Astro integration.
robots.txt.
JSON-LD Person schema with name, URL, and sameAs social links.
Images: optimize through astro:assets, with width and height set so there's no layout shift.
TODO guard: a script that fails the build if TODO: appears in the built output, so placeholders can never go live.
Targets:
Lighthouse 95+ in every category on mobile.
astro check and the build both pass with zero errors.
No broken internal links.
Phase 6: Deploy
Push to GitHub.
[MANUAL] In Vercel, import the repo. Astro is auto-detected. Deploy, then confirm the *.vercel.app URL works.
[MANUAL] In Vercel, go to Project → Settings → Domains.
Add yashshah.net and www.yashshah.net.
Set www to redirect to the bare domain.
Note the exact DNS records Vercel shows.
[MANUAL] In Spaceship, go to Domain Manager → yashshah.net → DNS.
Delete the default parking or URL-redirect records.
Add exactly the records Vercel showed (typically an A record for @ and a CNAME for www).
Don't delete MX records, which email forwarding needs.
After DNS propagates, Claude Code verifies with dig and curl:
Both hostnames resolve.
HTTPS works.
www redirects to https://yashshah.net.
Pages return 200 and the 404 page returns 404.
Phase 7: Email and extras
[MANUAL] In Spaceship's Email Forwarding, forward hi@yashshah.net to my Gmail, then send a test email to confirm it arrives.
Optional: enable Vercel Web Analytics and add its component.
Optional: add a GitHub Action that runs astro check and the build on pull requests.
Content checklist (I provide these; Claude Code should ask, not invent)
[ ] One-line pitch and a 2–3 sentence bio.
[ ] NetApp experience: title, start date, and 2–4 impact bullets, with no confidential details or internal project names.
[ ] 3–4 projects, each with the problem, what I built, one trade-off, the result, repo/demo links, and a screenshot.
[ ] Resume PDF.
[ ] GitHub and LinkedIn URLs.
[ ] Optional: a headshot and 1–2 blog post ideas.
Definition of done
The site is live at https://yashshah.net over HTTPS, and www redirects to it.
No TODO: placeholders appear in production.
Lighthouse targets are met, and it looks right on a real phone.
The link preview looks correct when shared on LinkedIn (check with LinkedIn's Post Inspector).
The README explains how to add a new project or post in under five minutes.
