# Professor Mujahid Sajjad — Author Website

A literary, RTL-first website for an Urdu poet, writer and professor:
author profile, a book library with **Read Online** and **Download PDF**,
a poetry section with category filtering, plus About and Contact pages.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Lucide icons · TypeScript

---

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint (next/core-web-vitals + next/typescript)
npm run typecheck  # tsc --noEmit
```

---

## Adding content (no UI changes needed)

### 1. Books — `lib/books.ts`

Append one object to `books`:

```ts
{
  id: "b004",
  slug: "my-new-book",            // URL: /books/my-new-book
  title: "اردو عنوان",
  titleEnglish: "English Title",
  description: "ارڈو وضاحت…",
  descriptionEnglish: "English description…",
  coverImage: "/images/covers/my-book.jpg", // optional — omit for the built-in typographic cover
  pdfUrl: "https://drive.google.com/file/d/FILE_ID/view",
  publishedYear: 2024,            // optional
  pages: 160,                     // optional
  category: "poetry",             // poetry | criticism | essays | research | other
  author: "Professor Mujahid Sajjad",
  authorUrdu: "پروفسر مجاہد سجاد",
}
```

`pdfUrl` accepts **any** URL. Google Drive share links, direct links, or a future
S3/R2/Cloudinary URL all work — viewer and download links are derived from it,
so moving off Google Drive later is a data change only.

- **Read Online** → `https://drive.google.com/file/d/FILE_ID/preview`
  (embedded in the site; the Drive viewer provides zoom + page navigation).
  If Drive blocks the embed, the reader falls back to
  *"Read this book on Google Drive"*.
- **Download PDF** → `https://drive.google.com/uc?export=download&id=FILE_ID`
- No PDF is ever bundled into the repository.

### 2. Poetry — `lib/poetry.ts`

Append one object to `poems`. Categories: `ghazal`, `nazm`, `aazad`, `ashar`,
`muntakhab`. Formatting: one line = one line of text, two consecutive lines =
one sher (couplet), a blank line = extra space.

**The poems currently in the file are sample texts** used to demonstrate the
reading layout. Replace them with the author's real work, then set
`isSample: false` — the on-page notice disappears automatically.

### 3. Author details, email, social links — `lib/site.ts`

- `contact.email` (currently a placeholder), optional `phone`, `location`
- `socials: []` — **no social icons are rendered while this array is empty**;
  add real URLs only, e.g.
  `{ platform: "facebook", label: "Facebook", url: "https://facebook.com/…" }`
- `siteConfig.url` — set to the real domain (used for SEO / Open Graph / sitemap)

### 4. Author portrait

Drop the photo at **`public/images/author.jpg`** — it is picked up
automatically everywhere (hero, About, home teaser). Until then an abstract
placeholder SVG, then a "مجا" monogram, is shown.

---

## Urdu typography & RTL

- Direction is set on `<html>` (RTL by default, LTR in English mode) with a
  pre-paint script so there is no flash on load. Preference is stored in
  `localStorage` under `ms-lang`.
- `.urdu`, `.urdu-display`, `.urdu-prose`, `.urdu-poetry` classes carry
  Nastaliq metrics (line-height 2.1–2.6, generous word-spacing).
- **Noori Nastaleeq:** place `Jameel-Noori-Nastaleeq.woff2` (or `.ttf`) in
  `public/fonts/` and it becomes the primary Urdu font immediately. See
  `public/fonts/README.txt`. Until then the site uses the open-licensed
  **Noto Nastaliq Urdu** (self-hosted by `next/font`).
- English UI uses **Inter**.

## Language toggle

`اردو | EN` in the navbar. Poetry text is never machine-translated: UI chrome
is bilingual (`lib/i18n.ts`), while book/poetry/about content is managed
separately in its own data files with Urdu + English fields.

## SEO

Per-page titles/descriptions/Open Graph, canonical URLs, `sitemap.xml`,
`robots.txt`, and JSON-LD (`Person` + `WebSite` globally, `Book` on book pages,
`CreativeWork` on poem pages).

## Accessibility

Semantic landmarks, skip link, keyboard navigation (the PDF reader closes with
`Escape` and traps focus on open), visible focus rings, alt text, ARIA labels
in both languages, and colour contrast checked against the palette.

## Deployment (Vercel)

```bash
vercel        # or connect the repo in the Vercel dashboard
```

Everything is statically generated (SSG) except nothing dynamic is required —
the build output deploys as-is. No backend is used; the contact form opens a
pre-filled email in the visitor's mail app.

## Project structure

```
app/                  routes (layout, home, books, books/[slug], poetry, …)
components/           reusable UI (header, footer, BookCard, PdfReader, …)
components/views/     client page views (bilingual, read language context)
lib/                  DATA + helpers: books.ts, poetry.ts, site.ts, i18n.ts
public/images/        author.jpg (add yours), placeholder SVG
public/fonts/         drop Noori Nastaleeq font files here
```
