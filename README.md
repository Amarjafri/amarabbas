# Amar Abbas — Portfolio (Next.js)

The Laravel portfolio, rebuilt as a Next.js App Router app so it can run on
Vercel. Same design, same URLs, same admin sections — the database is replaced
by JSON files in `data/`, and the admin panel saves by committing those files
back to GitHub.

---

## 1. Run it locally

```bash
cd nextjs
npm install
cp .env.example .env.local     # then fill in ADMIN_PASSWORD and AUTH_SECRET
npm run dev
```

Open <http://localhost:3000>. The admin panel is at `/admin`.

For local work you only need two variables:

```
ADMIN_PASSWORD=whatever-you-like
AUTH_SECRET=<openssl rand -base64 32>
```

In development the admin writes straight to `data/*.json` and saves images into
`public/uploads/` — no GitHub token, no Blob store, no network. Commit the
changed JSON when you are happy with it.

## 2. Push to GitHub

The app is the repository root — `package.json` and `data/` sit at the top level.

```bash
git add .
git commit -m "Add Next.js port"
git push
```

## 3. Import on Vercel

1. Vercel → **Add New… → Project** → import this repository.
2. **Root Directory: `./`** — the default. The app is the repository root.
3. Framework preset: Next.js (detected automatically). Leave the build and
   output settings alone.
4. Deploy.

## 4. Environment variables

Vercel → Project → **Settings → Environment Variables**. Add every one of these
for Production (and Preview, if you use preview deploys):

| Variable | What it is |
|---|---|
| `ADMIN_PASSWORD` | The password for `/admin/login`. |
| `AUTH_SECRET` | Signs the session cookie. `openssl rand -base64 32`. |
| `GITHUB_TOKEN` | Fine-grained PAT, **Contents: Read and write**, this repository only. This is what lets the admin panel save. |
| `GITHUB_REPO` | `owner/repo`, e.g. `Amarjafri/amarportfolio`. |
| `GITHUB_BRANCH` | Usually `main`. |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → create a Blob store; the token appears there. Needed for image and CV uploads. |
| `RESEND_API_KEY` | From resend.com. Without it the contact form still renders but tells visitors to email or WhatsApp instead of failing. |
| `CONTACT_TO_EMAIL` | Where enquiries are delivered. |
| `CONTACT_FROM_EMAIL` | Optional. Defaults to Resend's shared sender; switch to your own once your domain is verified with Resend. |
| `NEXT_PUBLIC_SITE_URL` | The public URL, e.g. `https://amarabbas.dev`. Used for canonical URLs, the sitemap and share links. |

Changing an environment variable does not rebuild the site — redeploy after
adding them.

## 5. Custom domain

Vercel → Project → **Settings → Domains** → add the domain and follow the DNS
instructions. Then update `NEXT_PUBLIC_SITE_URL` to match and redeploy, so the
sitemap and the blog share buttons point at the right host.

## 6. How saving works

This is the one real behavioural difference from the Laravel/MySQL version.

```
Admin edits a project
        ↓
Server Action validates it
        ↓
PUT to the GitHub Contents API  →  commit on `main`
        ↓
GitHub notifies Vercel          →  automatic redeploy
        ↓
New JSON is bundled into the pages  →  live (~40–90 seconds)
```

So a save is not instant — it takes about a minute for the change to appear on
the public site. The admin panel shows a banner saying exactly that. The upside
is that content lives in version control: every edit is a commit you can read,
revert or review, and the public pages stay fully static.

Two consequences worth knowing:

- **Two people editing at once can collide.** The write always re-reads the
  file's SHA immediately beforehand, so the second save is rejected with a clear
  "reload and try again" message rather than silently overwriting.
- **The public pages read the JSON that was bundled at build time**, never the
  live files. That is what makes them fast, and it is correct because every
  change causes a rebuild.

## 7. If instant saves ever matter more than file-based storage

The GitHub approach is free and keeps content in git, but a minute of latency is
a real cost. Moving to a free hosted Postgres (Neon or Supabase) is a contained
change:

- Rewrite `lib/store.ts` — `readCollection` / `writeCollection` become SQL.
- Rewrite the read helpers in `lib/data.ts` to query instead of importing JSON,
  and drop the static imports at the top of that file.

Nothing else changes. The pages, forms, actions, types and styling all stay as
they are, because every one of them goes through those two modules.

## 8. Layout of the code

```
data/                  content, one JSON file per old MySQL table
lib/
  data.ts              read side — static imports, used by public pages only
  store.ts             write side — fs in dev, GitHub Contents API in production
  types.ts             the schema, mirroring the MySQL columns
  auth.ts              password check + signed session cookie
  upload.ts            Vercel Blob in production, public/uploads in dev
  content-types.ts     the schema behind every "Site Content" screen
  settings-schema.ts   the tabs and fields of the Settings screen
  format.ts            Carbon date formats
app/(site)/            the public site — its own root layout and globals.css
app/(admin)/           the admin panel — its own root layout and admin.css
app/actions/           server actions (auth, contact, admin CRUD)
components/            shared React components
public/storage/        images copied out of Laravel's storage disk
middleware.ts          the /admin gate
```

The site and admin are **separate root layouts** on purpose: `globals.css` and
`admin.css` each define their own `:root` tokens, reset and `body` rules, and
would fight if both loaded on the same page.

## 9. Updating content from the old Laravel app

If the MySQL database changes and you want to pull it across again, from the
repository root:

```bash
php artisan export:json
```

That rewrites every file in `data/`. Review the diff before committing —
it is the only thing standing between the old database and the live site.

## 10. Known gaps carried over from the Laravel site

- `images/og-image.jpg` is referenced by the OpenGraph tags but has never
  existed — it 404s on the live Laravel site too. Drop a 1200×630 image at
  `public/images/og-image.jpg` and it starts working.
- No CV is set. Upload one from Settings → Profile.
- Contact submissions are emailed rather than stored, so there is no Messages
  screen. Everything else from the old admin is here.
