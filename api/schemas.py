"""Pydantic request/response schemas.

`Book` and `Poem` are identified by slug in the wire format, not by the
integer primary key — every URL in the site is slug-based, so exposing the id
would only add a type mismatch for the frontend to reconcile.
"""

import re
import unicodedata

from pydantic import BaseModel, ConfigDict, Field, field_validator

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
CATEGORIES = {"poetry", "criticism", "essays", "research", "other"}


def slugify(value: str) -> str:
    """Turn a title into a URL slug. ASCII-folded so Urdu titles still work."""
    folded = unicodedata.normalize("NFKD", value)
    ascii_only = folded.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_only).strip("-").lower()
    return slug[:120]


class BookBase(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    description: str = Field(default="", max_length=8000)
    cover_image: str | None = Field(default=None, max_length=500)
    pdf_url: str = Field(default="", max_length=500)
    category: str = Field(default="other")
    author: str = Field(default="", max_length=200)
    published_year: int | None = Field(default=None, ge=1000, le=2100)
    pages: int | None = Field(default=None, ge=1)
    publication: str | None = Field(default=None, max_length=300)
    sort_order: int = Field(default=0)

    @field_validator("title", "author", "category", "pdf_url", "description")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip()

    @field_validator("cover_image", "publication")
    @classmethod
    def _blank_to_none(cls, v: str | None) -> str | None:
        if v is None or not v.strip():
            return None
        return v.strip()

    @field_validator("category")
    @classmethod
    def _known_category(cls, v: str) -> str:
        if v not in CATEGORIES:
            raise ValueError(f"category must be one of {sorted(CATEGORIES)}")
        return v

    @field_validator("pdf_url", "cover_image")
    @classmethod
    def _safe_url(cls, v: str | None) -> str | None:
        # Site-relative paths (/images/x.png) are the normal case; anything
        # absolute must be http(s) so a `javascript:` URL cannot reach an href.
        if not v:
            return v
        if v.startswith("/"):
            return v
        if not v.startswith(("http://", "https://")):
            raise ValueError("must be a site path starting with / or an http(s) URL")
        return v


class BookCreate(BookBase):
    slug: str | None = Field(default=None, max_length=120)


class BookUpdate(BookBase):
    slug: str | None = Field(default=None, max_length=120)


class BookOut(BookBase):
    slug: str
    model_config = ConfigDict(from_attributes=True)


class PoemBase(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    body: str = Field(default="", max_length=20000)

    @field_validator("title", "body")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip()


class PoemCreate(PoemBase):
    slug: str | None = Field(default=None, max_length=160)


class PoemUpdate(PoemBase):
    slug: str | None = Field(default=None, max_length=160)


class PoemOut(PoemBase):
    slug: str
    model_config = ConfigDict(from_attributes=True)


class LoginIn(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=200)


class ReviewIn(BaseModel):
    book_slug: str = Field(max_length=120)
    name: str = Field(min_length=2, max_length=60)
    body: str = Field(min_length=20, max_length=1500)
    # Honeypot. A real reader never fills this; bots fill everything.
    website: str = Field(default="", max_length=200)

    @field_validator("name", "book_slug")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip()

    @field_validator("body")
    @classmethod
    def _strip_body(cls, v: str) -> str:
        # Trim the ends but keep interior newlines: reviewers use paragraphs.
        return v.strip()


class ReviewOut(BaseModel):
    """`book_title` and `book_slug` are resolved server-side so the carousel
    does not need the full book list just to caption a card."""

    id: int
    book_slug: str
    book_title: str
    name: str
    body: str
    model_config = ConfigDict(from_attributes=True)


class MessageOut(BaseModel):
    ok: bool = True
    detail: str = ""