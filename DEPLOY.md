# Deploy — manual steps

The site is built and committed on `main`. Everything below needs you in a
browser; Claude Code can't do these. Do them in order. When DNS is done, tell
Claude Code and it will verify with `dig` / `curl`.

`gh` (GitHub CLI) isn't installed on this machine, so step 1 is manual too.

---

## 1. Create the GitHub repo and push

1. Go to <https://github.com/new>.
   - **Name:** `yashshah.net`
   - **Visibility:** Public
   - **Do NOT** add a README, .gitignore, or license (the repo already has them).
2. Create the repo, then run these three commands in `D:\yashshahweb`:

```bash
git remote add origin https://github.com/<your-username>/yashshah.net.git
git branch -M main
git push -u origin main
```

If `git push` asks you to authenticate, use a GitHub Personal Access Token as the
password (Settings → Developer settings → Tokens), or install GitHub Desktop and
push from there.

---

## 2. Import into Vercel

1. Go to <https://vercel.com/new> (sign in with GitHub).
2. Import `yashshah.net`. Vercel auto-detects Astro — leave every build setting
   at its default (build `astro build`, output `dist`).
3. Deploy. When it finishes, open the `*.vercel.app` URL and click through:
   home, a project case study, the 404 (visit a bad path).

---

## 3. Add the custom domain in Vercel

1. Project → **Settings → Domains**.
2. Add `yashshah.net`. Add `www.yashshah.net`.
3. Set **`www.yashshah.net` to redirect to `yashshah.net`** (Vercel shows a
   "Redirect to" dropdown — pick the bare domain, 308).
4. Vercel now shows the DNS records it wants. **Write them down exactly.**
   They're almost always:
   - `A` record, host `@` → `76.76.21.21`
   - `CNAME` record, host `www` → `cname.vercel-dns.com`

   Use whatever Vercel actually shows you, not this from memory.

---

## 4. Point DNS at Vercel (Spaceship)

1. Spaceship → **Domain Manager → yashshah.net → DNS**.
2. **Delete** the default parking / URL-forward records (usually an `A` on `@`
   pointing at a Spaceship IP, and/or a `CNAME` on `www`).
3. **Add exactly the records Vercel showed** in step 3.4.
4. **Leave `MX` records alone** — email forwarding needs them.
5. Save. Propagation is usually minutes, sometimes up to an hour.

---

## 5. Email forwarding (Spaceship)

1. Spaceship → **Email Forwarding** for `yashshah.net`.
2. Forward `hi@yashshah.net` → your Gmail (`dragondager23@gmail.com`).
3. Send a test email to `hi@yashshah.net` and confirm it lands in Gmail.
4. Tell Claude Code once this works — it will flip `email.enabled` to `true` in
   `src/data/site.ts` (one line) so the address appears on the site, and push.

---

## 6. Verification (Claude Code runs this)

Once DNS has propagated, ask Claude Code to verify. It will run:

```bash
dig +short yashshah.net
dig +short www.yashshah.net
curl -sSI https://yashshah.net
curl -sSI https://www.yashshah.net          # expect 308 -> https://yashshah.net
curl -sS -o /dev/null -w "%{http_code}\n" https://yashshah.net/nope   # expect 404
```

Then check the link preview at
<https://www.linkedin.com/post-inspector/> with `https://yashshah.net`.

---

## Known gaps to close later (all one-line edits)

- **NetApp role** has no start date and no bullets — add them in
  `src/data/experience.ts` when ready.
- **`public/resume.pdf`** predates NetApp — drop in a new PDF, same filename.
- **No GitHub link** — add the URL to `links.github` in `src/data/site.ts` and
  set `enabled: true`.
- **Patent** shows title + number + date, no link (not publicly resolvable yet).
