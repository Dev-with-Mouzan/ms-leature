import "server-only";

/**
 * Data access for the FastAPI backend.
 *
 * Server-only: the base URL is a private value and is never needed in the
 * browser. Client components import these types with `import type`, which is
 * erased at build time, so they can use them without pulling this module in.
 *
 * Every read is cached for a minute. That is what makes an admin's edit appear
 * on the site within a minute, and it is also what keeps the site up if the
 * API is briefly unreachable — Next serves the last good copy while a failed
 * revalidate is retried.
 */

import type { Book } from "./books";

const BASE = (process.env.FASTAPI_URL ?? "http://localhost:8000").replace(/\/$/, "");

/** Read paths are shared by visitors and are safe to cache. */
const REVALIDATE = 60;

export type Poem = {
  slug: string;
  title: string;
  body: string;
  createdAt: string;
};

/** `bookTitle` is resolved by the backend, so a review card needs nothing else. */
export type Review = {
  id: number;
  bookSlug: string;
  bookTitle: string;
  name: string;
  body: string;
};

async function read<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: REVALIDATE } });
  if (!res.ok) {
    throw new Error(`Backend request failed: ${res.status} ${path}`);
  }
  return res.json() as Promise<T>;
}

/** A 404 means "no such book", not "backend broken", so it returns null. */
async function readOrNull<T>(path: string): Promise<T | null> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: REVALIDATE } });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Backend request failed: ${res.status} ${path}`);
  }
  return res.json() as Promise<T>;
}

export function getBooks(): Promise<Book[]> {
  return read<Book[]>("/books");
}

export function getBook(slug: string): Promise<Book | null> {
  return readOrNull<Book>(`/books/${encodeURIComponent(slug)}`);
}

export function getPoems(): Promise<Poem[]> {
  return read<Poem[]>("/poems");
}

export function getPoem(slug: string): Promise<Poem | null> {
  return readOrNull<Poem>(`/poems/${encodeURIComponent(slug)}`);
}

export function getReviews(limit = 12): Promise<Review[]> {
  return read<Review[]>(`/reviews?limit=${limit}`);
}

export function getReviewsForBook(slug: string): Promise<Review[]> {
  return read<Review[]>(`/books/${encodeURIComponent(slug)}/reviews`);
}

/**
 * Write a review. Never cached, and the response is thrown away — the caller
 * refreshes the page to pick the new row up.
 */
export async function postReview(payload: {
  bookSlug: string;
  name: string;
  body: string;
  website: string;
}): Promise<void> {
  const res = await fetch(`${BASE}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.detail ?? "Your review could not be saved.");
  }
}