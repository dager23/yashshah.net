# Deploy — manual steps

Done already, via GitHub + the Vercel CLI:

- ✅ Repo pushed: <https://github.com/dager23/yashshah.net>
- ✅ Vercel project `yashshahweb` created and linked, GitHub connected for
  continuous deployment (every push to `main` auto-deploys)
- ✅ Live at <https://yashshahweb.vercel.app> — verified (200s, real 404)
- ✅ `yashshah.net` and `www.yashshah.net` attached to the project
- ✅ `www.yashshah.net` set to 308-redirect to `yashshah.net`

**One step left, and it's the only one that has to happen in a browser:**
point Spaceship's DNS at Vercel.

---

## Point DNS at Vercel (Spaceship)

Spaceship is currently serving its own parking page for `yashshah.net` — that's
why the domain isn't live yet even though Vercel is fully configured.

1. Spaceship → **Domain Manager → yashshah.net → DNS**.
2. **Delete** the existing `A` record on `@` and any `CNAME` on `www` (the
   parking/redirect ones Spaceship added by default).
3. **Add exactly these two records** (confirmed straight from Vercel for this
   domain — `vercel domains inspect`):

   | Type  | Host | Value               |
   | ----- | ---- | ------------------- |
   | A     | @    | `76.76.21.21`        |
   | CNAME | www  | `cname.vercel-dns.com` |

4. **Leave `MX` records alone** — email forwarding needs them.
5. Save. Propagation is usually minutes, sometimes up to an hour.

Tell Claude Code once you've saved these — it can re-run
`vercel domains inspect yashshah.net` and `dig`/`curl` to confirm the moment
it's live, rather than you having to guess when propagation finished.

---

## 2. Email forwarding (Spaceship)

1. Spaceship → **Email Forwarding** for `yashshah.net`.
2. Forward `hi@yashshah.net` → your Gmail (`dragondager23@gmail.com`).
3. Send a test email to `hi@yashshah.net` and confirm it lands in Gmail.
4. Tell Claude Code once this works — it will flip `email.enabled` to `true` in
   `src/data/site.ts` (one line) so the address appears on the site, and push.

---

## 3. Verification (Claude Code runs this)

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
