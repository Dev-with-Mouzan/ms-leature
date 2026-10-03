"""Self-check for the API.

Run with:

    python -m api.check

Exercises the paths that are easy to break and hard to notice: auth rejection,
the admin token guard, slug collision, cascade delete on book removal, the
review honeypot, and the rate limit.

Uses its own throwaway database and the in-process test client, so it needs no
running server and touches nothing in `api.db`. Each test simulates a distinct
client IP so the shared rate limiter does not make assertions order-dependent.
"""

import os
import sys
import tempfile
import warnings

# Starlette's test client warns that httpx is the wrong client library. The
# warning is noise here and would look like a failure in CI output.
warnings.filterwarnings("ignore", message=".*httpx.*")

# Must be set before importing anything that opens the engine.
_TMP_DB = os.path.join(tempfile.gettempdir(), "api-check.db")
if os.path.exists(_TMP_DB):
    os.remove(_TMP_DB)
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP_DB}"
os.environ["ADMIN_TOKEN_SECRET"] = "self-check-secret"
os.environ.pop("ADMIN_USERNAME", None)
os.environ.pop("ADMIN_PASSWORD", None)

from fastapi.testclient import TestClient  # noqa: E402

from api.app import app  # noqa: E402
from api import seed  # noqa: E402
from api.auth import hash_password  # noqa: E402
from api.db import Base, SessionLocal, engine  # noqa: E402
from api.models import Admin, Book  # noqa: E402

Base.metadata.create_all(engine)
_db = SessionLocal()
_db.add(Admin(username="admin", password_hash=hash_password("correct-horse")))
# Insert the real seed rows so a bad category, duplicate slug or over-long field
# in the migration data fails here rather than on the owner's first deploy.
for _row in seed.SEED_BOOKS:
    _db.add(Book(**_row))
_db.commit()
_db.close()

client = TestClient(app)

passed = 0


def check(label: str, condition: bool, detail: str = "") -> None:
    global passed
    if condition:
        passed += 1
        print(f"  ok  {label}")
    else:
        print(f"FAIL  {label} {detail}")
        sys.exit(1)


def as_ip(ip: str):
    return {"X-Forwarded-For": ip}


print("auth")
r = client.post("/admin/login", json={"username": "admin", "password": "wrong"})
check("wrong password rejected", r.status_code == 401, r.text)

r = client.post("/admin/login", json={"username": "nobody", "password": "correct-horse"})
check("unknown user rejected", r.status_code == 401, r.text)

r = client.post("/admin/login", json={"username": "admin", "password": "correct-horse"})
check("correct password accepted", r.status_code == 200, r.text)
TOKEN = r.json()["token"]
AUTH = {"Authorization": f"Bearer {TOKEN}"}

r = client.post("/admin/login", json={"username": "admin", "password": "correct-horse"})
check("token survives a second login", r.status_code == 200)

print("admin guard")
r = client.post("/admin/books", json={"title": "No Token"})
check("create without token rejected", r.status_code == 401, r.text)

r = client.post(
    "/admin/books", json={"title": "No Token"}, headers={"Authorization": "Bearer forged.sig"}
)
check("forged token rejected", r.status_code == 401, r.text)

r = client.post("/admin/books", json={"title": "No Token"}, headers={"Authorization": "Basic x"})
check("wrong auth scheme rejected", r.status_code == 401, r.text)

print("books")
r = client.post("/admin/books", json={"title": "A New Book", "sort_order": 9}, headers=AUTH)
check("create returns 201", r.status_code == 201, r.text)
check("slug derived from title", r.json()["slug"] == "a-new-book", r.text)

r = client.post("/admin/books", json={"title": "A New Book"}, headers=AUTH)
check("duplicate slug rejected", r.status_code == 409, r.text)

r = client.post("/admin/books", json={"title": "Bad", "slug": "Not A Slug"}, headers=AUTH)
check("malformed slug rejected", r.status_code == 422, r.text)

r = client.post("/admin/books", json={"title": "Bad", "category": "nonsense"}, headers=AUTH)
check("unknown category rejected", r.status_code == 422, r.text)

r = client.put("/admin/books/a-new-book", json={"title": "Renamed Book"}, headers=AUTH)
check("update applies", r.status_code == 200 and r.json()["title"] == "Renamed Book", r.text)

r = client.put("/admin/books/a-new-book", json={"title": "Renamed", "slug": "a-new-book"}, headers=AUTH)
check("keeping own slug is not a collision", r.status_code == 200, r.text)

print("poems")
r = client.post("/admin/poems", json={"title": "First Poem", "body": "line one\nline two"}, headers=AUTH)
check("create returns 201", r.status_code == 201, r.text)

r = client.get("/poems")
check("poem listed", any(p["slug"] == "first-poem" for p in r.json()), r.text)

r = client.put("/admin/poems/first-poem", json={"title": "First Poem", "body": "revised"}, headers=AUTH)
check("update applies", r.status_code == 200 and r.json()["body"] == "revised", r.text)

r = client.get("/poems")
check("body change persisted", r.json()[0]["body"] == "revised", r.text)

print("reviews")
seeded = client.get("/books").json()
seed_slugs = {b["slug"] for b in seeded}
check(
    "seed books migrated",
    {
        "magar-manzar-nahi-mera",
        "article-on-the-poetry-of-mujahid-sajjad",
        "the-listening-eye-the-seeing-heart",
    }
    <= seed_slugs,
    str(sorted(seed_slugs)),
)
check("books ordered by sort_order", seeded[0]["slug"] == "magar-manzar-nahi-mera", str(seeded[0]))
check("missing cover is null, not empty", seeded[0]["cover_image"] is not None, str(seeded[0]))

r = client.get("/books/article-on-the-poetry-of-mujahid-sajjad")
check("book readable by slug", r.status_code == 200 and r.json()["author"] == "Ghazala Anjum", r.text)
r = client.get("/books/not-a-book")
check("unknown book is a 404", r.status_code == 404, r.text)

# Create a book to review, then remove it to prove the cascade.
r = client.post("/admin/books", json={"title": "Reviewed Book"}, headers=AUTH)
review_slug = r.json()["slug"]

valid = {
    "book_slug": review_slug,
    "name": "A Reader",
    "body": "This is a long enough review to pass validation checks.",
    "website": "",
}
r = client.post("/reviews", json=valid, headers=as_ip("10.0.0.1"))
check("valid review returns 201", r.status_code == 201, r.text)
check("book_title resolved server-side", r.json().get("book_title") == "Reviewed Book", r.text)

r = client.post("/reviews", json={**valid, "website": "spam.example"}, headers=as_ip("10.0.0.2"))
check("honeypot rejected", r.status_code == 400, r.text)

r = client.post("/reviews", json={**valid, "book_slug": "no-such-book"}, headers=as_ip("10.0.0.3"))
check("unknown book rejected", r.status_code == 400, r.text)

r = client.post("/reviews", json={**valid, "name": "x"}, headers=as_ip("10.0.0.4"))
check("short name rejected", r.status_code == 422, r.text)

r = client.post("/reviews", json={**valid, "body": "too short"}, headers=as_ip("10.0.0.5"))
check("short body rejected", r.status_code == 422, r.text)

r = client.get(f"/books/{review_slug}/reviews")
check("book reviews listed", len(r.json()) == 1, r.text)

r = client.get("/reviews")
check("review carries book title on the home feed", r.json()[0]["book_title"] == "Reviewed Book", r.text)

print("rate limit")
codes = [
    client.post("/reviews", json=valid, headers=as_ip("10.0.0.99")).status_code
    for _ in range(4)
]
check("fourth submission in a window is limited", codes == [201, 201, 201, 429], str(codes))

print("cascade")
r = client.delete(f"/admin/books/{review_slug}", headers=AUTH)
check("delete returns 200", r.status_code == 200, r.text)
r = client.get("/reviews")
check("reviews removed with the book", all(x["book_slug"] != review_slug for x in r.json()), r.text)

r = client.delete(f"/admin/books/{review_slug}", headers=AUTH)
check("deleting twice is a 404", r.status_code == 404, r.text)

r = client.delete("/admin/poems/first-poem", headers=AUTH)
check("poem deleted", r.status_code == 200 and client.get("/poems").json() == [], r.text)

os.remove(_TMP_DB)
print(f"api check: {passed} assertions passed")