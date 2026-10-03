"""SQLAlchemy models.

Field names mirror the TypeScript `Book` type so the existing UI needs no
renaming when data moves out of `lib/books.ts` and into the database.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base, utcnow


class Admin(Base):
    __tablename__ = "admins"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str] = mapped_column(Text, default="")
    # Optional path under /public. Omit to render the typographic cover.
    cover_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Google Drive view URL or a direct HTTPS link.
    pdf_url: Mapped[str] = mapped_column(String(500), default="")
    category: Mapped[str] = mapped_column(String(40), default="other")
    author: Mapped[str] = mapped_column(String(200), default="")
    published_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pages: Mapped[int | None] = mapped_column(Integer, nullable=True)
    publication: Mapped[str | None] = mapped_column(String(300), nullable=True)
    # Display order. The first book by the site author is the featured one.
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    reviews: Mapped[list["Review"]] = relationship(
        back_populates="book", cascade="all, delete-orphan", passive_deletes=True
    )


class Poem(Base):
    __tablename__ = "poems"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(300))
    body: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    book: Mapped[Book] = relationship(back_populates="reviews")
    # ON DELETE CASCADE means deleting a book takes its reviews with it,
    # instead of leaving rows pointing at nothing.
    book_id: Mapped[int] = mapped_column(
        ForeignKey("books.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(60))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)