import { createClient, type Client } from "@libsql/client";
import { join } from "node:path";

/**
 * Reviews storage. Turso/libSQL in production, a local SQLite file in
 * development so the site runs with no account.
 *
 * The DDL is duplicated in db/schema.sql for the owner's SQL editor. Keep the
 * two identical: IF NOT EXISTS makes running it per process harmless.
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

/** Idempotent and memoised, so a fresh database works without manual SQL. */
export function ensureSchema(): Promise<void> {
  schema ??= getDb()
    .execute(CREATE_TABLE)
    .then(() => getDb().execute(CREATE_INDEX))
    .then(() => undefined);
  return schema;
}