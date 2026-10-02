/**
 * Pure review validation. No imports, no I/O.
 *
 * Kept import-free so the self-check runs it under Node type-stripping
 * (`npm run check`) without a test framework, tsx, or tsconfig changes, and so
 * the route handler can call it on every submission.
 *
 * This is a public write path: treat every field as hostile.
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
      error: `Your name must be ${NAME_MIN}-${NAME_MAX} characters.`,
    };
  }

  const body = typeof input.body === "string" ? input.body.trim() : "";
  if (body.length < BODY_MIN || body.length > BODY_MAX) {
    return {
      ok: false,
      error: `A review must be ${BODY_MIN}-${BODY_MAX} characters.`,
    };
  }

  return {
    ok: true,
    value: { book_slug: bookSlug, author_name: authorName, body },
  };
}