# Migration notes — Laravel 12 → Next.js (App Router)

Developer reference produced during Phase 0. Describes the *source* app so every
porting decision can be checked against it.

## Source app at a glance

| | |
|---|---|
| Framework | Laravel 12, Blade, MySQL (`pro`) |
| Styling | **Hand-written CSS**, no Tailwind (`public/css/app.css`, 3484 lines) |
| JS | One vanilla IIFE, `public/js/app.js` (282 lines) |
| Fonts | Google Fonts: Fraunces (display), Inter Tight (body), JetBrains Mono (meta) |
| Icons | Font Awesome 6.5.1 via CDN |
| Uploads | `storage/app/public/**`, served through the `public/storage` symlink |
| CV | `public/files/<slug>-<ts>.pdf`, path stored in `settings.cv_file` |

Because the site does **not** use Tailwind, `globals.css` is a verbatim copy of
`public/css/app.css`. Do not introduce a utility framework.

## Route map

### Public
| Laravel route | Controller | Next.js |
|---|---|---|
| `GET /` | `HomeController@index` | `app/page.tsx` |
| `GET /projects` | `ProjectController@index` | `app/projects/page.tsx` |
| `GET /projects/{slug}` | `ProjectController@show` | `app/projects/[slug]/page.tsx` |
| `GET /blog` | `BlogController@index` | `app/blog/page.tsx` |
| `GET /blog/{slug}` | `BlogController@show` | `app/blog/[slug]/page.tsx` |
| `POST /contact/send` | `ContactController@send` | Server Action → Resend |

Error views (403/404/419/500/503) extend the public layout → `app/not-found.tsx`
plus `app/error.tsx`.

### Admin (all behind `auth`)
`/admin`, `/admin/settings` (+ `photo`, `cv`), `/admin/projects` CRUD,
`/admin/blog` CRUD, `/admin/messages`, `/admin/testimonials`, and a
schema-driven `/admin/content/{type}` covering seven content types:
`experiences · skills · tech · highlights · stats · menu · social`.

## Schema (exported to `data/<table>.json`)

| Table | Rows | Columns |
|---|---|---|
| `projects` | 7 | id, title, slug, category, project_type, description, **impact**, challenges, tech_stack *(comma string)*, image, **gallery** *(JSON array)*, live_url, github_url, client_name, year, is_featured, sort_order, status, timestamps |
| `blog_posts` | 4 | id, title, slug, excerpt, body, category, image, published, read_time, timestamps |
| `testimonials` | 6 | id, name, position, company, message, rating, avatar, active, sort_order, timestamps |
| `settings` | 82 | key/value pairs → exported as **one JSON object** |
| `experiences` | 5 | title, company, period, duration, location, is_current, **bullets** *(newline list)*, **tags** *(comma list)*, sort_order, active |
| `skill_groups` | 6 | icon, title, **skills** *(comma list)*, sort_order, active |
| `tech_items` | 15 | icon, label, sort_order, active |
| `highlights` | 4 | icon, title, subtitle, sort_order, active |
| `hero_stats` | 3 | number, label, short_label, sort_order, active |
| `nav_links` | 7 | label, url, sort_order, in_header, in_footer, active |
| `social_links` | 4 | icon, label, value, url, sort_order, in_contact, in_footer, is_social_btn, active |
| `contact_messages` | 0 | **not exported** — replaced by Resend email |

`users` is not exported either; admin auth becomes a single `ADMIN_PASSWORD`.

### Ordering rules (must be preserved)
- `projects` list: `sort_order ASC, created_at DESC`
- featured projects: `is_featured = 1`, `sort_order ASC`, limit `settings.projects_limit`
- `blog_posts`: `published = 1`, `created_at DESC`, limit `settings.blog_limit` on home
- everything using the `Orderable` trait: `active = 1`, `sort_order ASC, id ASC`

### Derived fields the Blade views compute
- `Experience::bulletList()` → split `bullets` on newlines
- `Experience::tagList()`, `SkillGroup::skillList()` → split on commas
- `Project.tech_stack` → `explode(',')`, first 5 on cards, all on the detail page
- `NavLink::href()` → `#x` becomes `/#x`; `/x` stays; absolute URLs pass through
- `SocialLink::isExternal()` → `^https?://`
- `settings` helpers: `setting()` (falls back to `Setting::DEFAULTS`),
  `setting_on()` (`1|on|true|yes`), `setting_lines()` (split on newlines)

### Slug format
`Str::slug(title) . '-' . time()` — e.g. `faraac-1779088412`.
**Never regenerate on edit**; existing URLs must keep resolving.

## Client-side behaviour to port (`public/js/app.js`)
`initTheme` (localStorage `theme` + `data-theme` on `<html>`, applied pre-paint),
`initNavScroll` (`.scrolled` past 24px), `initActiveSection`,
`initMobileMenu` (overlay + Escape + body scroll lock), `initReveal`
(IntersectionObserver, 60 ms stagger, `.visible`), `initCounters` (count-up on
`.stat-n`/`.esc-n`, keeps `+`/`%` affixes), `initSmoothScroll`,
`initContactForm` (disable + "Sending…"), `initFilters` (`.filter-btn` →
`[data-category]`, sets `hidden`). All motion guarded by `prefers-reduced-motion`.

Project detail also has an inline lightbox; blog detail has a copy-link button.

## SEO to reproduce
Per-page `<title>` from settings (`home_title`, `projects_page_meta`,
`blog_page_meta`, `"<title> — Amar Abbas"` on detail pages), `meta_description`,
`meta_keywords`, author, dual `theme-color` (`#12161a` dark / `#fbfaf8` light),
OpenGraph (type/title/description/image `images/og-image.jpg`/url) and
`twitter:card = summary_large_image`.

## Known quirks
- `projects/show` and `blog/show` render body text with `nl2br(e($text))` —
  escaped, then newlines to `<br>`. Not raw HTML. Reproduce exactly.
- Settings values are **strings**; booleans are `"1"`/`"0"`.
- `Setting::get()` falls back to a hard-coded `DEFAULTS` map when a key is empty
  — exported as `settings.json` merged over those defaults so nothing is lost.
- Laravel paginates 9 per page on `/projects` and `/blog`; with 7 and 4 rows the
  pagination control never renders. Ported as plain lists.

---

# Decisions taken during the port

| Question | Decision | Why |
|---|---|---|
| Tailwind? | **No** | The Laravel app has no `tailwind.config.js`; `public/css/app.css` is 3484 hand-written lines. `globals.css` is a verbatim copy plus a six-line block remapping the three font tokens onto `next/font` variables. |
| One root layout or two? | **Two** (`app/(site)` and `app/(admin)`) | `app.css` and `admin.css` each declare their own `:root` tokens, `*` reset and `body` rules. Loading both on one page would let them fight. Route groups give each subtree its own CSS chunk. |
| Fonts | `next/font/google`, self-hosted | Same three faces and the same fallback stacks; removes two render-blocking requests to Google. |
| Pagination | Dropped | Laravel paginated 9 per page; there are 7 projects and 4 posts, so the control never rendered. The empty `.pagination-wrap` div is kept so spacing is identical. |
| Messages screen | Removed | Contact submissions are emailed via Resend now, so there is no table to list. The dashboard tile says so rather than showing a dead link. |
| Admin login | Password only | The Blade form asked for an email and a password against a `users` table. There is one operator, so the port checks `ADMIN_PASSWORD` and drops the email field rather than showing one that is never verified. |
| Blog form sidebar | Moved inside the `<form>` | The Blade version placed category / read-time / publish outside the form and relied on a half-wired `form=` attribute, so those fields did not always submit. |
| `read_time`, `year`, etc. | Kept as-is | Every column name and value matches MySQL so `php artisan export:json` can be re-run at any time without remapping. |

## Verified

- `npm run build` — clean, 28 routes, zero type errors, zero lint errors.
- All 7 project slugs and 4 post slugs pre-render, including
  `faraac-1779088412` and `yasrab-testing-system-yts-1778651660`.
- Admin CRUD exercised against the real server actions in dev: create → 8 rows,
  edit → **slug unchanged**, delete → back to 7; settings round-tripped; a
  content-type row created and deleted. All writes landed in `data/*.json`.
- `/admin` redirects to `/admin/login` without a session cookie.
- Every image referenced by the exported JSON (48 of them) resolves.

## Not done

- `public/images/og-image.jpg` — referenced by the OG tags but missing from the
  Laravel app and 404 on the live site, so there was nothing to copy.
- `public/files/<cv>.pdf` — `settings.cv_file` is empty and the live site's CV
  URL 404s, so no CV was carried over. Upload one from Settings → Profile.
