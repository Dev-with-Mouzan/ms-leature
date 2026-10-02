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