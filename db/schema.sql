-- Reviews storage. One table, reviews only.
-- Run once in the Turso SQL editor: https://docs.turso.tech
--
-- Must stay identical to SCHEMA_SQL in lib/db.ts. IF NOT EXISTS makes it safe
-- for the app to run it too, so a fresh database works without this step.

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_slug TEXT NOT NULL,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON reviews (created_at DESC);