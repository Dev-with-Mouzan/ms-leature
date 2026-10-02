import assert from "node:assert/strict";
import { validateReview } from "./validate-review.ts";

const SLUGS = ["book-one", "book-two"];

const good = {
  book_slug: "book-one",
  author_name: "A Reader",
  body: "x".repeat(30),
};

const accepted = validateReview(good, SLUGS);
assert.equal(accepted.ok, true, "a valid review must be accepted");

const trimmed = validateReview({ ...good, author_name: "  A   Reader  " }, SLUGS);
assert.equal(
  trimmed.ok && trimmed.value.author_name,
  "A Reader",
  "name is trimmed and inner whitespace collapsed",
);

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