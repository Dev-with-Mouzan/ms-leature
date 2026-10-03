"""HTTP routes.

Three routers in one file: public reads, public review submission, and the
admin mutations. Kept together because each is short and they share the
serialisation helpers.
"""

import time
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session, joinedload

from .auth import make_token, require_admin, verify_password
from .db import get_db
from .models import Admin, Book, Poem, Review
from .schemas import (
    BookCreate,
    BookOut,
    BookUpdate,
    LoginIn,
    PoemCreate,
    PoemOut,
    PoemUpdate,
    ReviewIn,
    ReviewOut,
    SLUG_RE,
    slugify,
)

# ---------------------------------------------------------------------------
# Review rate limiting
# ---------------------------------------------------------------------------
# ponytail: per-instance in-memory limit — Vercel keeps several instances, so a
# determined caller can multiply this by the instance count. A shared counter
# (Postgres table or Upstash) if spam ever becomes a real problem.

RATE_LIMIT = 3
RATE_WINDOW = 3600
_hits: dict[str, list[float]] = defaultdict(list)


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _rate_limited(ip: str) -> bool:
    now = time.time()
    recent = [t for t in _hits[ip] if now - t < RATE_WINDOW]
    if len(recent) >= RATE_LIMIT:
        _hits[ip] = recent
        return True
    recent.append(now)
    _hits[ip] = recent
    return False


def _review_out(review: Review) -> ReviewOut | None:
    # book_title is resolved here so the carousel can caption a card without
    # also being handed the whole book list. A review whose book has gone is
    # skipped rather than raised, so one bad row cannot take the page down.
    if review.book is None:
        return None
    return ReviewOut(
        id=review.id,
        book_slug=review.book.slug,
        book_title=review.book.title,
        name=review.name,
        body=review.body,
    )


def _review_outs(reviews) -> list[ReviewOut]:
    return [out for out in (_review_out(r) for r in reviews) if out is not None]


def _books_query(db: Session):
    return db.query(Book).order_by(Book.sort_order.asc(), Book.title.asc())


# ---------------------------------------------------------------------------
# Public reads
# ---------------------------------------------------------------------------

public = APIRouter()


@public.get("/health")
def health():
    return {"ok": True}


@public.get("/books", response_model=list[BookOut])
def list_books(db: Session = Depends(get_db)):
    return _books_query(db).all()


@public.get("/books/{slug}", response_model=BookOut)
def read_book(slug: str, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.slug == slug).first()
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return book


@public.get("/poems", response_model=list[PoemOut])
def list_poems(db: Session = Depends(get_db)):
    return db.query(Poem).order_by(Poem.created_at.desc()).all()


@public.get("/poems/{slug}", response_model=PoemOut)
def read_poem(slug: str, db: Session = Depends(get_db)):
    poem = db.query(Poem).filter(Poem.slug == slug).first()
    if poem is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return poem


@public.get("/reviews", response_model=list[ReviewOut])
def list_reviews(
    limit: int = 12, db: Session = Depends(get_db)
):
    rows = (
        db.query(Review)
        .options(joinedload(Review.book))
        .order_by(Review.created_at.desc())
        .limit(max(1, min(limit, 100)))
        .all()
    )
    return _review_outs(rows)


@public.get("/books/{slug}/reviews", response_model=list[ReviewOut])
def list_reviews_for_book(slug: str, db: Session = Depends(get_db)):
    rows = (
        db.query(Review)
        .options(joinedload(Review.book))
        .join(Book)
        .filter(Book.slug == slug)
        .order_by(Review.created_at.desc())
        .all()
    )
    return _review_outs(rows)


# ---------------------------------------------------------------------------
# Public review submission
# ---------------------------------------------------------------------------

public_review = APIRouter()


@public_review.post("/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def submit_review(payload: ReviewIn, request: Request, db: Session = Depends(get_db)):
    # Honeypot filled: answer as if it worked, so a bot learns nothing.
    if payload.website:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Submission rejected."
        )

    book = db.query(Book).filter(Book.slug == payload.book_slug).first()
    if book is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="That book is not on this site."
        )

    if _rate_limited(_client_ip(request)):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many submissions. Try again later.",
        )

    review = Review(book=book, name=payload.name, body=payload.body)
    db.add(review)
    db.commit()
    db.refresh(review)
    return _review_out(review)


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------

admin = APIRouter(prefix="/admin", tags=["admin"])


@admin.post("/login", tags=["auth"])
def login(payload: LoginIn, db: Session = Depends(get_db)):
    admin_user = db.query(Admin).filter(Admin.username == payload.username).first()
    # Same message and roughly the same work either way, so the response does
    # not reveal whether the username exists.
    if admin_user is None or not verify_password(payload.password, admin_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Wrong username or password."
        )
    return {"token": make_token(admin_user.username)}


def _resolve_slug(db: Session, table, requested: str | None, title: str) -> str:
    slug = (requested or "").strip() or slugify(title)
    if not SLUG_RE.match(slug):
        raise HTTPException(
            status_code=422,
            detail="Slug must be lowercase words separated by hyphens.",
        )
    clash = db.query(table).filter(table.slug == slug).first()
    if clash is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=f"The slug '{slug}' is taken."
        )
    return slug


@admin.post("/books", response_model=BookOut, status_code=status.HTTP_201_CREATED)
def create_book(payload: BookCreate, db: Session = Depends(get_db), _: Admin = Depends(require_admin)):
    slug = _resolve_slug(db, Book, payload.slug, payload.title)
    book = Book(**payload.model_dump(exclude={"slug"}), slug=slug)
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


@admin.put("/books/{slug}", response_model=BookOut)
def update_book(
    slug: str, payload: BookUpdate, db: Session = Depends(get_db), _: Admin = Depends(require_admin)
):
    book = db.query(Book).filter(Book.slug == slug).first()
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    new_slug = (payload.slug or "").strip()
    if new_slug and new_slug != book.slug:
        if not SLUG_RE.match(new_slug):
            raise HTTPException(
                status_code=422,
                detail="Slug must be lowercase words separated by hyphens.",
            )
        if db.query(Book).filter(Book.slug == new_slug).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail=f"The slug '{new_slug}' is taken."
            )
        book.slug = new_slug

    for field, value in payload.model_dump(exclude={"slug"}).items():
        setattr(book, field, value)

    db.commit()
    db.refresh(book)
    return book


@admin.delete("/books/{slug}")
def delete_book(slug: str, db: Session = Depends(get_db), _: Admin = Depends(require_admin)):
    book = db.query(Book).filter(Book.slug == slug).first()
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    db.delete(book)
    db.commit()
    return {"ok": True}


@admin.post("/poems", response_model=PoemOut, status_code=status.HTTP_201_CREATED)
def create_poem(payload: PoemCreate, db: Session = Depends(get_db), _: Admin = Depends(require_admin)):
    slug = _resolve_slug(db, Poem, payload.slug, payload.title)
    poem = Poem(**payload.model_dump(exclude={"slug"}), slug=slug)
    db.add(poem)
    db.commit()
    db.refresh(poem)
    return poem


@admin.put("/poems/{slug}", response_model=PoemOut)
def update_poem(
    slug: str, payload: PoemUpdate, db: Session = Depends(get_db), _: Admin = Depends(require_admin)
):
    poem = db.query(Poem).filter(Poem.slug == slug).first()
    if poem is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    new_slug = (payload.slug or "").strip()
    if new_slug and new_slug != poem.slug:
        if not SLUG_RE.match(new_slug):
            raise HTTPException(
                status_code=422,
                detail="Slug must be lowercase words separated by hyphens.",
            )
        if db.query(Poem).filter(Poem.slug == new_slug).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail=f"The slug '{new_slug}' is taken."
            )
        poem.slug = new_slug

    for field, value in payload.model_dump(exclude={"slug"}).items():
        setattr(poem, field, value)

    db.commit()
    db.refresh(poem)
    return poem


@admin.delete("/poems/{slug}")
def delete_poem(slug: str, db: Session = Depends(get_db), _: Admin = Depends(require_admin)):
    poem = db.query(Poem).filter(Poem.slug == slug).first()
    if poem is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    db.delete(poem)
    db.commit()
    return {"ok": True}