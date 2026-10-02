# Book Reviews — Design Spec

Date: 2026-10-02
Status: awaiting user review

## Problem

The site has no way to collect or show what readers say about the books. The owner
wants visitors to leave a review on any book, and wants those reviews displayed
on the home page immediately before the closing "Literary conversations are
welcome." CTA.

## Goal

Visitors submit a review on a book's page. Reviews appear on the home page, four
at a time, in a horizontally animating carousel. The database stores reviews and
nothing else.

## Decisions already approved

| Decision | Choice | Why |
|---|---|---|
| Submission | Visitor form, publishes on its own | Owner asked for it; no approval queue |
| Host | Vercel + custom domain | Filesystem is read-only there, so a local `.db` file cannot be used in production |
| Database | **Turso / libSQL (SQLite dialect)** | Real SQL, single table, matches "reviews only" |
| ORM | None. Official `@libsql/client` driver, hand-written SQL | One table does not justify an ORM |
| Review display | Home, before the closing CTA; also on each book page | As requested |
| Carousel | 4 visible, auto-advances leftward when more than 4 | As requested |
| Auth / accounts | None | Not requested |

## Out of scope (YAGNI)

Star ratings, an admin moderation UI, replies or threads, review images,
pagination or "load more", email notifications, CAPTCHA, and a database per
site section. Ratings are one `ALTER TABLE` away if they are ever wanted.

## Architecture

```
Browser ──POST /api/reviews──> lib/reviews.ts ──> lib/db.ts ──> Turso (libSQL)
   │                             validateReview()
   └──GET / (ISR 60s)──> HomeView ──> getReviews() ──> ReviewCarousel (client)
```

Three server-only modules and two client components. No new runtime, no ORM, no
API routes beyond the one.

### Components

**`lib/db.ts`** — creates the libSQL client once.

- `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` present → remote Turso database.
- Both absent → `file:reviews.db`, so local development needs no account.
- Both env vars are **server-only**. Never prefix with `NEXT_PUBLIC_`.

**`lib/reviews.ts`** — all SQL lives here. Nothing else queries the database.

- `getReviews(limit?)` → newest first. Default limit `12`; the home carousel
  uses the default so page size stays bounded, and each book page passes no
  limit. Returns `[]` when the database is unreachable, so a database outage
  never takes the page down.
- `createReview(input)` → inserts and returns the stored row.
- `validateReview(input)` → **pure function, no I/O.** Returns
  `{ ok: true, value }` or `{ ok: false, error }`. Kept pure so it is testable
  without a database.

**`app/api/reviews/route.ts`** — `POST` only. Reads JSON, runs
`validateReview`, inserts, returns `201`. Returns `400` with a message the form
shows inline, or `429` when rate limited.

**`components/ReviewForm.tsx`** (client) — rendered on each book page.
Fields: name, review body, plus a hidden `website` honeypot. Posts to
`/api/reviews`. On success shows a thank-you message and calls
`router.refresh()`. Errors render inline, never `alert()`.

**`components/ReviewCarousel.tsx`** (client) — receives reviews as props from a
server component, so the text is in the HTML for crawlers and readers.
- Horizontal track: 1 card on mobile, 2 at `sm`, 4 at `lg`.
- `overflow-x-auto`, `scroll-behavior: smooth`, scroll snap.
- When `total > 4`, auto-advances one card leftward every 4s and wraps to the
  start at the end. Pauses on hover and on focus within.
- `prefers-reduced-motion: reduce` → no auto-advance; native scrolling only.
  The design system already honours this preference.
- The scroller is `tabIndex={0}` with `role="region"` and an `aria-label`, so
  keyboard arrow keys scroll it. **No prev/next buttons.**
- Each card shows the review text, the reviewer's name, and the book title as a
  link to that book's page, so a reader can get from a quote to the work.
- If there are zero reviews the home section is not rendered at all. On a book
  page with no reviews, only the form and a short "no reviews yet" line show.

### Data flow

1. Visitor fills the form on `/books/[slug]` and submits.
2. `POST /api/reviews` → `validateReview` → `createReview` → `201`.
3. Client calls `router.refresh()`; the page re-renders with the new review.
4. Independently, home and book pages revalidate every 60s, so reviews appear
   for everyone else without a rebuild.

On a book page the order is: book details, then the review form, then that
book's reviews. Someone arriving to evaluate the work finds the form before they
find other people's opinions.

## Data model

`db/schema.sql`, run once in Turso's SQL editor:

```sql
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_slug TEXT NOT NULL,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON reviews (created_at DESC);
```

One table, four columns plus `id`. `book_slug` matches the `slug` field in
`lib/books.ts`. No foreign key is possible because `books` is a TypeScript array,
not a table — the API validates slugs against that array instead.

## Validation and abuse protection

This is a public write path, so it is treated as a trust boundary.

| Rule | Value | Why |
|---|---|---|
| `book_slug` must exist in `books` | reject `400` | Stops junk referencing books that do not exist |
| `author_name` | 2–60 chars, trimmed | Stops one-word spam and stuffing |
| `body` | 20–1500 chars, trimmed | Stops empty and stuffed submissions |
| `website` honeypot | must be empty | Bots fill hidden fields, humans do not |
| Rate limit | 3 submissions per hour per IP | Bounds spam without a CAPTCHA |
| Output encoding | React default escaping | Reviews render as text, never HTML |

The rate limiter is an in-memory `Map`, which is per-instance.

`ponytail: rate limit is per-instance and resets on redeploy; move it to a shared
store (Upstash Redis, or a SQLite table keyed by IP) only if you ever run more
than one server instance.`

## Rendering strategy

Home and `app/books/[slug]/page.tsx` become `export const revalidate = 60`
instead of pure static generation. They stay cached and fast; new reviews appear
within a minute. All other routes are unaffected.

## Degraded behaviour

| Situation | Result |
|---|---|
| No Turso env vars | Local `file:reviews.db`; full functionality on a laptop |
| Database unreachable | `getReviews()` returns `[]`; page renders, section shows a quiet "no reviews yet" line |
| `db/schema.sql` never run | Reads return `[]`; submissions return a plain "reviews are not available right now" error. Running the SQL is the fix, not a redeploy |
| Submission fails validation | Inline error in the form; nothing written |

The site builds and deploys successfully in every one of these cases.

## Files

**Added**

- `db/schema.sql`
- `lib/db.ts`
- `lib/reviews.ts`
- `lib/reviews.check.ts` — assert-based self-check, `npm run check`
- `app/api/reviews/route.ts`
- `components/ReviewForm.tsx`
- `components/ReviewCarousel.tsx`
- `.env.example`

**Changed**

- `components/views/HomeView.tsx` — carousel section before the closing CTA
- `app/books/[slug]/page.tsx` — `revalidate = 60`, that book's reviews, the form
- `package.json` — add `@libsql/client`, add `check` script

**Dependencies added:** `@libsql/client` only.

## Testing

One runnable check, `lib/reviews.check.ts`, run with `npm run check`
(`node --experimental-strip-types`, available in Node 24). It asserts the
validation rules that matter: unknown slug rejected, too-short name rejected,
too-short body rejected, a valid review accepted, and honeypot rejection. Node's
built-in `assert`, no test framework.

Manual verification: submit a review in a browser and confirm it appears in the
carousel within a minute.

## Deployment steps (owner)

1. Create a Turso database at turso.tech and get the URL and auth token.
2. Run `db/schema.sql` in its SQL editor.
3. Put `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in `.env.local` for local
   work, and in Vercel's Environment Variables for production.
4. Point the custom domain at Vercel as usual.

Until step 3, reviews write to `file:reviews.db` locally and the production
section shows the empty state. Nothing breaks.