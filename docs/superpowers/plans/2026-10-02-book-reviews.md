# Book Reviews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Visitors submit a review on any book page; reviews appear on the home page in a four-up carousel that auto-advances leftward.

**Architecture:** One Turso/libSQL SQLite table holding reviews and nothing else, reached through a single server-only module. A pure validation function is tested by a dependency-free Node self-check; a `POST` route validates, rate-limits and inserts; two client components (carousel, form) render on ISR pages so new reviews appear within 60 seconds.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, `@libsql/client` (Turso), Node 24 built-in `node:assert`.

**Spec:** `docs/superpowers/specs/2026-10-02-book-reviews-design.md`

## Global Constraints

- One dependency added, no more: `@libsql/client`. No ORM, no test framework, no state library.
- Database holds reviews only. Table: `reviews(id INTEGER PRIMARY KEY AUTOINCREMENT, book_slug TEXT NOT NULL, author_name TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))` plus index `reviews_created_at_idx ON reviews (created_at DESC)`.
- `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are **server-only**. Never prefix with `NEXT_PUBLIC_`.
- When both Turso vars are unset, fall back to `file:<cwd>/reviews.db` so local work needs no account.
- Validation is a **pure function with no imports**, `validateReview(input, validSlugs)`, living in `lib/validate-review.ts`. This split exists so the self-check can import it under Node type-stripping without changing `tsconfig.json` or adding `tsx`.
- Submission limits: `author_name` 2–60 chars trimmed, `body` 20–1500 chars trimmed, `book_slug` must exist in `books`, honeypot `website` must be empty, 3 submissions per hour per IP.
- Auto-publish. No moderation queue, no ratings, no accounts. All four are out of scope.
- Home and book detail pages become `export const revalidate = 60`. No other route changes.
- Carousel: 1 card mobile, 2 at `sm`, 4 at `lg`. Auto-advance leftward every 4s **only** when `reviews.length > 4`. Pause on hover and focus. `prefers-reduced-motion: reduce` disables auto-advance and forces `behavior: "auto"` on any programmatic scroll.
- Follow existing design tokens (`ink-900`, `cream-50`, `line`, `gold-*`, `muted`) and existing class idioms. No new colours, no new shadows.
- Accessibility: scroller is `tabIndex={0}` `role="region"` with an `aria-label` so keyboard arrows scroll it. No prev/next buttons. Errors render inline; never `alert()`.

---

### Task 1: Database access layer

**Files:**
- Create: `db/schema.sql`
- Create: `lib/db.ts`
- Create: `.env.example`
- Modify: `package.json` (dependency `@libsql/client`)
- Modify: `.gitignore` (ignore the local `reviews.db`)

**Interfaces:**
- Consumes: nothing.
- Produces: `getDb(): Client` and `ensureSchema(): Promise<void>` from `@/lib/db`. Every later task imports these two names.

- [ ] **Step 1: Install the driver**

Run: `npm install @libsql/client`
Expected: added to `dependencies`, no peer warnings that break the build.

- [ ] **Step 2: Write the schema file**

`db/schema.sql`:

```sql
-- Run once in the Turso SQL editor: https://docs.turso.tech/drizzle/sqlite
-- Must stay identical to SCHEMA_SQL in lib/db.ts.
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_slug TEXT NOT NULL,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON reviews (created_at DESC);
```

- [ ] **Step 3: Write the client module**

`lib/db.ts`:

```ts
import { createClient, type Client } from "@libsql/client";
import { join } from "node:path";

/**
 * Reviews storage. Turso/libSQL in production, a local SQLite file in
 * development so the site runs with no account.
 *
 * DDL is duplicated in db/schema.sql for the owner's SQL editor. Keep the two
 * identical: IF NOT EXISTS makes running it per process harmless.
 */
const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_slug TEXT NOT NULL,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

const CREATE_INDEX =
  "CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON reviews (created_at DESC)";

let client: Client | undefined;
let schema: Promise<void> | undefined;

export function getDb(): Client {
  client ??=
    process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN
      ? createClient({
          url: process.env.TURSO_DATABASE_URL,
          authToken: process.env.TURSO_AUTH_TOKEN,
        })
      : createClient({ url: `file:${join(process.cwd(), "reviews.db")}` });
  return client;
}

/** Idempotent, and memoised, so a fresh database works without manual SQL. */
export function ensureSchema(): Promise<void> {
  schema ??= getDb()
    .execute(CREATE_TABLE)
    .then(() => getDb().execute(CREATE_INDEX))
    .then(() => undefined);
  return schema;
}
```

- [ ] **Step 4: Write the env example**

`.env.example`:

```
# Reviews database (turso.tech). Both server-only: never prefix NEXT_PUBLIC_.
# Leave unset locally and the site writes to reviews.db instead.
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# Canonical origin for production. Required.
NEXT_PUBLIC_SITE_URL=

# Real inbox address. The built-in fallback is a placeholder.
NEXT_PUBLIC_CONTACT_EMAIL=
```

- [ ] **Step 5: Ignore the local database file**

Append to `.gitignore`:

```
reviews.db
```

- [ ] **Step 6: Verify it type-checks and the module loads**

Run: `npm run typecheck && node -e "import('./lib/db.ts').then(m => m.getDb() && console.log('db module ok'))"`
Expected: typecheck passes, then `db module ok`.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json db/schema.sql lib/db.ts .env.example .gitignore
git commit -m "feat: add libSQL reviews storage layer"
```

---

### Task 2: Review validation, test first

**Files:**
- Create: `lib/validate-review.ts`
- Create: `lib/validate-review.check.mts`
- Modify: `package.json` (add `check` script)

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```ts
  type ReviewInput = {
    book_slug?: unknown;
    author_name?: unknown;
    body?: unknown;
    website?: unknown;
  };
  type ValidReview = { book_slug: string; author_name: string; body: string };
  type ValidationResult =
    | { ok: true; value: ValidReview }
    | { ok: false; error: string };
  function validateReview(input: ReviewInput, validSlugs: string[]): ValidationResult;
  ```
  Later tasks import `validateReview` and `ValidReview` from `@/lib/validate-review`.

- [ ] **Step 1: Write the failing self-check**

`lib/validate-review.check.mts`:

```ts
import assert from "node:assert/strict";
import { validateReview } from "./validate-review.ts";

const SLUGS = ["book-one", "book-two"];

const good = { book_slug: "book-one", author_name: "A Reader", body: "x".repeat(30) };

const accepted = validateReview(good, SLUGS);
assert.equal(accepted.ok, true, "a valid review must be accepted");

const trimmed = validateReview(
  { ...good, author_name: "  A   Reader  " },
  SLUGS,
);
assert.equal(trimmed.ok && trimmed.value.author_name, "A Reader", "name is trimmed and collapsed");

assert.equal(
  validateReview({ ...good, book_slug: "nope" }, SLUGS).ok,
  false,
  "unknown slug is rejected",
);
assert.equal(
  validateReview({ ...good, author_name: "A" }, SLUGS).ok,
  false,
  "one-character name is rejected",
);
assert.equal(
  validateReview({ ...good, author_name: "A".repeat(61) }, SLUGS).ok,
  false,
  "61-character name is rejected",
);
assert.equal(
  validateReview({ ...good, body: "too short" }, SLUGS).ok,
  false,
  "short body is rejected",
);
assert.equal(
  validateReview({ ...good, body: "x".repeat(1501) }, SLUGS).ok,
  false,
  "1501-character body is rejected",
);
assert.equal(
  validateReview({ ...good, website: "http://spam.example" }, SLUGS).ok,
  false,
  "filled honeypot is rejected",
);
assert.equal(
  validateReview({ ...good, author_name: 42 }, SLUGS).ok,
  false,
  "non-string name is rejected",
);

console.log("validateReview: 9 assertions passed");
```

- [ ] **Step 2: Run it and watch it fail**

Add the script first:

```json
"check": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON lib/validate-review.check.mts"
```

Run: `npm run check`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `lib/validate-review.ts`.

- [ ] **Step 3: Write the minimal implementation**

`lib/validate-review.ts`:

```ts
/**
 * Pure review validation. No imports, no I/O — the self-check runs this under
 * Node type-stripping and the route handler calls it per submission.
 * This is a public write path; treat every field as hostile.
 */

export type ReviewInput = {
  book_slug?: unknown;
  author_name?: unknown;
  body?: unknown;
  website?: unknown;
};

export type ValidReview = {
  book_slug: string;
  author_name: string;
  body: string;
};

export type ValidationResult =
  | { ok: true; value: ValidReview }
  | { ok: false; error: string };

const NAME_MIN = 2;
const NAME_MAX = 60;
const BODY_MIN = 20;
const BODY_MAX = 1500;

export function validateReview(
  input: ReviewInput,
  validSlugs: string[],
): ValidationResult {
  // Honeypot: hidden from humans, filled by bots.
  if (typeof input.website === "string" && input.website.trim() !== "") {
    return { ok: false, error: "Submission rejected." };
  }

  const bookSlug =
    typeof input.book_slug === "string" ? input.book_slug.trim() : "";
  if (!validSlugs.includes(bookSlug)) {
    return { ok: false, error: "That book is not on this site." };
  }

  const authorName =
    typeof input.author_name === "string"
      ? input.author_name.trim().replace(/\s+/g, " ")
      : "";
  if (authorName.length < NAME_MIN || authorName.length > NAME_MAX) {
    return {
      ok: false,
      error: `Your name must be ${NAME_MIN}–${NAME_MAX} characters.`,
    };
  }

  const body = typeof input.body === "string" ? input.body.trim() : "";
  if (body.length < BODY_MIN || body.length > BODY_MAX) {
    return {
      ok: false,
      error: `A review must be ${BODY_MIN}–${BODY_MAX} characters.`,
    };
  }

  return { ok: true, value: { book_slug: bookSlug, author_name: authorName, body } };
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npm run check`
Expected: `validateReview: 9 assertions passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/validate-review.ts lib/validate-review.check.mts package.json
git commit -m "feat: validate review submissions with a self-check"
```

---

### Task 3: Review queries

**Files:**
- Create: `lib/reviews.ts`

**Interfaces:**
- Consumes: `getDb`, `ensureSchema` from `@/lib/db`; `ValidReview` from `@/lib/validate-review`.
- Produces:
  ```ts
  type Review = {
    id: number;
    book_slug: string;
    author_name: string;
    body: string;
    created_at: string;
  };
  function getReviews(limit?: number): Promise<Review[]>;      // default 12
  function getReviewsForBook(bookSlug: string): Promise<Review[]>;
  function createReview(review: ValidReview): Promise<Review>;
  ```

- [ ] **Step 1: Write the module**

`lib/reviews.ts`:

```ts
import { ensureSchema, getDb } from "./db";
import type { ValidReview } from "./validate-review";

export type Review = {
  id: number;
  book_slug: string;
  author_name: string;
  body: string;
  created_at: string;
};

const COLUMNS = "id, book_slug, author_name, body, created_at";

function toReview(row: Record<string, unknown>): Review {
  return {
    id: Number(row.id),
    book_slug: String(row.book_slug),
    author_name: String(row.author_name),
    body: String(row.body),
    created_at: String(row.created_at),
  };
}

/** Reads never throw: a database outage must not take a page down. */
export async function getReviews(limit = 12): Promise<Review[]> {
  try {
    await ensureSchema();
    const result = await getDb().execute({
      sql: `SELECT ${COLUMNS} FROM reviews ORDER BY created_at DESC, id DESC LIMIT ?`,
      args: [limit],
    });
    return result.rows.map((row) => toReview(row as Record<string, unknown>));
  } catch (error) {
    console.error("[reviews] read failed", error);
    return [];
  }
}

export async function getReviewsForBook(bookSlug: string): Promise<Review[]> {
  try {
    await ensureSchema();
    const result = await getDb().execute({
      sql: `SELECT ${COLUMNS} FROM reviews WHERE book_slug = ? ORDER BY created_at DESC, id DESC`,
      args: [bookSlug],
    });
    return result.rows.map((row) => toReview(row as Record<string, unknown>));
  } catch (error) {
    console.error("[reviews] read failed", error);
    return [];
  }
}

export async function createReview(review: ValidReview): Promise<Review> {
  await ensureSchema();
  const inserted = await getDb().execute({
    sql: "INSERT INTO reviews (book_slug, author_name, body) VALUES (?, ?, ?)",
    args: [review.book_slug, review.author_name, review.body],
  });
  const stored = await getDb().execute({
    sql: `SELECT ${COLUMNS} FROM reviews WHERE id = ?`,
    args: [Number(inserted.lastInsertRowid)],
  });
  return toReview(stored.rows[0] as Record<string, unknown>);
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Note the round-trip is verified in Task 4, not here**

`lib/reviews.ts` imports `./db` without a file extension, which Next resolves but plain
Node does not. Running `node -e "import('./lib/reviews.ts')"` therefore fails with
`ERR_MODULE_NOT_FOUND` and this is expected — do not add `.ts` extensions to app code or
`allowImportingTsExtensions` to tsconfig just to make a scratch script work.

The insert and read paths are proven through the running app instead: Task 4 posts a
real review over HTTP and expects `201`, and Task 7 renders the home page and checks
the review text appears. Delete any local database left over from a failed attempt:

Run: `Remove-Item -ErrorAction SilentlyContinue reviews.db`
Expected: file gone, and `git status --short` shows no `reviews.db`.

- [ ] **Step 5: Commit**

```bash
git add lib/reviews.ts docs/superpowers/plans/2026-10-02-book-reviews.md
git commit -m "feat: read and write reviews"
```

---

### Task 4: Submission route with rate limiting

**Files:**
- Create: `app/api/reviews/route.ts`

**Interfaces:**
- Consumes: `validateReview`, `books`, `createReview`.
- Produces: `POST /api/reviews` → `201 {ok:true}` | `400 {error}` | `429 {error}` | `503 {error}`.

- [ ] **Step 1: Write the route**

`app/api/reviews/route.ts`:

```ts
import { NextResponse } from "next/server";

import { books } from "@/lib/books";
import { createReview } from "@/lib/reviews";
import { validateReview } from "@/lib/validate-review";

export const runtime = "nodejs";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const MAX_TRACKED_IPS = 5000;

// ponytail: in-memory rate limit is per-instance and resets on redeploy. Move it
// to a shared store only if you ever run more than one server instance.
const hits = new Map<string, number[]>();

function overLimit(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  if (hits.size > MAX_TRACKED_IPS) hits.clear();
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (overLimit(ip)) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = validateReview(payload, books.map((book) => book.slug));
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  try {
    await createReview(result.value);
  } catch (error) {
    console.error("[reviews] insert failed", error);
    return NextResponse.json(
      { error: "Reviews are not available right now. Please try again later." },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
```

- [ ] **Step 2: Verify the route against a running dev server**

Start `npm run dev` in the background and note the port it prints (this workspace has
been using 3210, not the 3000 default). Then, with that port as `$PORT`:

```bash
curl -s -o NUL -w "%{http_code}" -X POST http://localhost:3210/api/reviews -H "Content-Type: application/json" -d "{\"book_slug\":\"nope\",\"author_name\":\"A Reader\",\"body\":\"This body is definitely long enough to pass.\"}"
```
Expected: `400`.

Then repeat four times with a valid slug from `lib/books.ts`:
```bash
curl -s -o NUL -w "%{http_code}" -X POST http://localhost:3210/api/reviews -H "Content-Type: application/json" -d "{\"book_slug\":\"magar-manzar-nahi-mera\",\"author_name\":\"Plan Check\",\"body\":\"This body is definitely long enough to pass.\"}"
```
Expected: `400` (the rejected unknown slug above already consumed one slot), then `201`, `201`, `429` across the next three calls. Restart the dev server before this run if you want the counts to start clean.

- [ ] **Step 3: Stop the dev server and commit**

```bash
git add app/api/reviews/route.ts
git commit -m "feat: accept review submissions with rate limiting"
```

---

### Task 5: Review carousel

**Files:**
- Create: `components/ReviewCarousel.tsx`

**Interfaces:**
- Consumes: `Review` (type-only import) from `@/lib/reviews`; `getBookBySlug` from `@/lib/books`.
- Produces: `export default function ReviewCarousel({ reviews }: { reviews: Review[] })`.

- [ ] **Step 1: Write the component**

`components/ReviewCarousel.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { getBookBySlug } from "@/lib/books";
import type { Review } from "@/lib/reviews";

const ADVANCE_MS = 4000;
const GAP_PX = 24;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function ReviewCarousel({ reviews }: { reviews: Review[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  const advance = useCallback(() => {
    const track = trackRef.current;
    const card = track?.firstElementChild;
    if (!track || !(card instanceof HTMLElement)) return;

    const end = track.scrollLeft + card.offsetWidth + GAP_PX;
    const max = track.scrollWidth - track.clientWidth;
    track.scrollTo({
      left: end >= max ? 0 : end,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, []);

  useEffect(() => {
    if (reviews.length <= 4 || paused || prefersReducedMotion()) return;
    const timer = setInterval(advance, ADVANCE_MS);
    return () => clearInterval(timer);
  }, [advance, paused, reviews.length]);

  if (reviews.length === 0) return null;

  return (
    <div
      ref={trackRef}
      role="region"
      aria-label="Reader reviews"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2"
    >
      {reviews.map((review) => {
        const book = getBookBySlug(review.book_slug);
        return (
          <figure
            key={review.id}
            className="w-[85%] shrink-0 snap-start border border-line bg-cream-50 p-6 sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-0.75rem)]"
          >
            <blockquote className="text-[0.9375rem] leading-relaxed text-ink-900">
              {review.body}
            </blockquote>
            <figcaption className="mt-5 border-t border-line pt-4">
              <p className="text-sm font-medium text-ink-900">
                {review.author_name}
              </p>
              {book && (
                <Link
                  href={`/books/${book.slug}`}
                  className="mt-1 block text-xs text-muted underline decoration-gold-500 underline-offset-4 transition-colors hover:text-gold-700"
                >
                  {book.title}
                </Link>
              )}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify it type-checks and lints**

Run: `npm run typecheck && npm run lint`
Expected: clean. The type-only import of `Review` must not pull the database module into the browser bundle.

- [ ] **Step 3: Commit**

```bash
git add components/ReviewCarousel.tsx
git commit -m "feat: add four-up review carousel"
```

---

### Task 6: Review form

**Files:**
- Create: `components/ReviewForm.tsx`

**Interfaces:**
- Consumes: `POST /api/reviews` from Task 4.
- Produces: `export default function ReviewForm({ bookSlug }: { bookSlug: string })`.

- [ ] **Step 1: Write the component**

`components/ReviewForm.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type State =
  | { status: "idle"; error?: string }
  | { status: "busy" }
  | { status: "sent" };

export default function ReviewForm({ bookSlug }: { bookSlug: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(
      new FormData(form).entries(),
    ) as Record<string, string>;

    setState({ status: "busy" });
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book_slug: bookSlug,
          author_name: fields.author_name ?? "",
          body: fields.body ?? "",
          website: fields.website ?? "",
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setState({ status: "idle", error: payload.error ?? "Something went wrong." });
        return;
      }

      form.reset();
      setState({ status: "sent" });
      router.refresh();
    } catch {
      setState({ status: "idle", error: "Network error. Please try again." });
    }
  }

  if (state.status === "sent") {
    return (
      <p className="border border-gold-500/60 bg-cream-50 p-5 text-sm text-ink-900">
        Thank you — your review is published.
      </p>
    );
  }

  const busy = state.status === "busy";

  return (
    <form onSubmit={handleSubmit} className="max-w-[46ch]">
      <div className="space-y-4">
        <div>
          <label htmlFor="author_name" className="block text-sm font-medium text-ink-900">
            Your name
          </label>
          <input
            id="author_name"
            name="author_name"
            type="text"
            required
            maxLength={60}
            className="mt-2 min-h-11 w-full border border-line bg-paper px-3 py-2 text-sm text-ink-900"
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-ink-900">
            Your review
          </label>
          <textarea
            id="body"
            name="body"
            required
            minLength={20}
            maxLength={1500}
            rows={5}
            className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm leading-relaxed text-ink-900"
          />
        </div>

        {/* Honeypot: hidden from humans, filled by bots. */}
        <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
      </div>

      {state.status === "idle" && state.error && (
        <p role="alert" className="mt-4 text-sm text-ink-900">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-5 inline-flex min-h-11 items-center justify-center bg-ink-900 px-5 py-2.5 text-sm font-medium text-cream-50 transition-colors hover:bg-ink-700 disabled:opacity-60"
      >
        {busy ? "Publishing…" : "Publish review"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Verify it type-checks and lints**

Run: `npm run typecheck && npm run lint`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/ReviewForm.tsx
git commit -m "feat: add book review form"
```

---

### Task 7: Home page carousel

**Files:**
- Modify: `components/views/HomeView.tsx` (async component; new section before the closing CTA)
- Modify: `app/page.tsx` (`export const revalidate = 60`)

**Interfaces:**
- Consumes: `getReviews` from `@/lib/reviews`, `ReviewCarousel` from `@/components/ReviewCarousel`.
- Produces: nothing new.

- [ ] **Step 1: Read the tail of HomeView**

Run: `Select-String -Path components/views/HomeView.tsx -Pattern "Literary conversations" -Context 20,10`
Expected: the closing CTA section, with the text inside it.

- [ ] **Step 2: Make HomeView async and load reviews**

Change `export default function HomeView() {` to `export default async function HomeView() {` and add at the top of the body:

```tsx
const reviews = await getReviews();
```

Add the import:

```tsx
import { getReviews } from "@/lib/reviews";
import ReviewCarousel from "@/components/ReviewCarousel";
```

- [ ] **Step 3: Insert the section immediately before the closing CTA**

```tsx
{reviews.length > 0 && (
  <section className="border-b border-line bg-paper">
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <SectionHeading
        eyebrow="From readers"
        title="What people say"
        description="Reviews left by visitors. Every title in the library stays free to read."
      />
      <div className="mt-10">
        <ReviewCarousel reviews={reviews} />
      </div>
    </div>
  </section>
)}
```

Reuse the existing `SectionHeading` import if `HomeView` already has it; otherwise add
`import SectionHeading from "@/components/SectionHeading";`. Its props are exactly
`eyebrow?: string`, `title: ReactNode`, `description?: string`, `tone?: "dark" | "light"`,
so the block above is valid as written. Leave `tone` off — the section is on `bg-paper`.

- [ ] **Step 4: Add revalidation to the page**

In `app/page.tsx`, add above the default export:

```tsx
export const revalidate = 60;
```

- [ ] **Step 5: Verify against a production build with data present**

Insert a temporary row into the local database, then run `npm run build && npm start`:

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --input-type=module -e "import { createReview } from './lib/reviews.ts'; import { books } from './lib/books.ts'; for (let i = 0; i < 5; i++) await createReview({ book_slug: books[0].slug, author_name: 'Reader ' + i, body: 'Sample review number ' + i + ' used to check the carousel renders four cards and scrolls.' });"
```

Expected: `curl http://localhost:<port npm start prints>/` contains `From readers`, `What people say`, and five `Reader ` names.

- [ ] **Step 6: Clean up and commit**

```bash
Remove-Item -ErrorAction SilentlyContinue reviews.db
git add components/views/HomeView.tsx app/page.tsx
git commit -m "feat: show reader reviews on the home page"
```

---

### Task 8: Book detail page

**Files:**
- Modify: `app/books/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getReviewsForBook`, `ReviewCarousel`, `ReviewForm`.
- Produces: nothing new.

- [ ] **Step 1: Read the page**

Run: `Get-Content app/books/[slug]/page.tsx`
Expected: a `generateStaticParams`, `generateMetadata`, and a default export rendering book details.

- [ ] **Step 2: Add revalidation and data loading**

Add above the default export:

```tsx
export const revalidate = 60;
```

Inside the default export, after `const book = getBookBySlug(params.slug)` style lookup and its not-found guard:

```tsx
const reviews = await getReviewsForBook(book.slug);
```

Add imports:

```tsx
import { getReviewsForBook } from "@/lib/reviews";
import ReviewCarousel from "@/components/ReviewCarousel";
import ReviewForm from "@/components/ReviewForm";
```

- [ ] **Step 3: Render form then reviews after the book detail block**

```tsx
<section className="border-b border-line bg-paper">
  <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
    <SectionHeading
      eyebrow="Reader reviews"
      title="Write a review"
      description="Found something worth saying about this book? It appears on the home page straight away."
    />
    <div className="mt-10 grid gap-12 lg:grid-cols-2">
      <ReviewForm bookSlug={book.slug} />
      <div>
        {reviews.length > 0 ? (
          <ReviewCarousel reviews={reviews} />
        ) : (
          <p className="text-sm text-muted">No reviews yet.</p>
        )}
      </div>
    </div>
  </div>
</section>
```

Add the import `import SectionHeading from "@/components/SectionHeading";` if the page
does not already have it. Props are exactly `eyebrow?`, `title`, `description?`, `tone?`,
so the block above is valid as written.

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run build`
Expected: clean, and `/books/magar-manzar-nahi-mera` returns `200` with `Write a review` present.

- [ ] **Step 5: Commit**

```bash
git add app/books/[slug]/page.tsx
git commit -m "feat: collect and show reviews on book pages"
```

---

### Task 9: Full verification

**Files:** none changed.

- [ ] **Step 1: Run everything**

Run: `npm run check && npm run lint && npm run typecheck && npm run build`
Expected: 9 assertions, clean lint, clean typecheck, successful build.

- [ ] **Step 2: Smoke-test the routes**

Run `npm start`, then check `/`, `/books`, `/books/magar-manzar-nahi-mera`, `/about`, `/contact`, `/api/reviews` (POST a bad body, expect `400`).
Expected: pages `200`, bad POST `400`.

- [ ] **Step 3: Confirm no secret is tracked**

Run: `git status --short` and `git ls-files | Select-String "env|reviews.db"`
Expected: no `.env` file and no `reviews.db` tracked.

- [ ] **Step 4: Commit any remaining tracked changes**

```bash
git add -u
git commit -m "chore: verify reviews feature"
```