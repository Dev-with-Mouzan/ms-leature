/**
 * BOOK SHAPE AND URL HELPERS
 * ---------------------------------------------------------------
 * The library itself now lives in the FastAPI backend and is read through
 * `lib/api.ts`, because the admin panel can add and remove books. What stays
 * here is everything that is pure logic: the type, the category labels, and
 * the Google Drive URL handling.
 *
 * Adding a book no longer means editing this file — use /admin/books/new.
 *
 * HONESTY RULE: descriptions describe what is verifiable about the book. Do
 * not add publication years, page counts, publishers, prizes or critical
 * reception unless you can cite them — an invented fact on an author site is
 * worse than a missing one.
 */

export type BookCategory =
  | "poetry"
  | "criticism"
  | "essays"
  | "research"
  | "other";

export type Book = {
  slug: string;
  title: string;
  description: string;
  /** Path under /public — omit to render the typographic cover */
  coverImage?: string | null;
  /** Source PDF (Google Drive view URL or direct link) */
  pdfUrl: string;
  publishedYear?: number | null;
  category: BookCategory;
  pages?: number | null;
  author: string;
  /** Optional publisher / publication note */
  publication?: string | null;
};

export const categoryLabels: Record<BookCategory, string> = {
  poetry: "Poetry",
  criticism: "Criticism",
  essays: "Essays",
  research: "Research",
  other: "Literature",
};

/* ------------------------------------------------------------------ */
/* Google Drive / URL helpers                                          */
/* ------------------------------------------------------------------ */

/** Extracts the file id from any Google Drive URL shape. */
export function driveFileId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/** Embedded viewer for the in-site reading experience. */
export function embedUrl(book: Book): string {
  const id = driveFileId(book.pdfUrl);
  if (id) return `https://drive.google.com/file/d/${id}/preview`;
  return book.pdfUrl;
}

/** Direct download link. */
export function downloadUrl(book: Book): string {
  const id = driveFileId(book.pdfUrl);
  if (id) return `https://drive.google.com/uc?export=download&id=${id}`;
  return book.pdfUrl;
}

/** "Open in a new tab" link — Drive's full page viewer for Drive files. */
export function externalReadUrl(book: Book): string {
  const id = driveFileId(book.pdfUrl);
  if (id) return `https://drive.google.com/file/d/${id}/view`;
  return book.pdfUrl;
}

/** The rest of the library, for the "Also in the library" strip. */
export function relatedBooks(book: Book, all: Book[], limit = 3): Book[] {
  return all.filter((b) => b.slug !== book.slug).slice(0, limit);
}