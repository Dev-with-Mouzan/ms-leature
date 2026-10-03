"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Download, Tag, User } from "lucide-react";
import type { Book } from "@/lib/books";
import { categoryLabels, downloadUrl, relatedBooks } from "@/lib/books";
import type { Review } from "@/lib/api";
import { siteConfig } from "@/lib/site";
import BookCover from "@/components/BookCover";
import BookCard from "@/components/BookCard";
import PdfReader from "@/components/PdfReader";
import ReviewCarousel from "@/components/ReviewCarousel";
import ReviewForm from "@/components/ReviewForm";
import Reveal from "@/components/Reveal";

export default function BookDetailView({
  book,
  reviews = [],
  allBooks = [],
}: {
  book: Book;
  reviews?: Review[];
  allBooks?: Book[];
}) {
  const [readerOpen, setReaderOpen] = useState(false);
  const more = relatedBooks(book, allBooks, 3);
  const byAuthor = book.author === siteConfig.author.name;

  const facts = [
    { icon: User, label: "Author", value: book.author },
    { icon: Tag, label: "Category", value: categoryLabels[book.category] },
    ...(book.publishedYear
      ? [{ icon: Tag, label: "Published", value: String(book.publishedYear) }]
      : []),
    ...(book.publication
      ? [{ icon: Tag, label: "Publication", value: book.publication }]
      : []),
  ];

  return (
    <>
      <section className="border-b border-line bg-cream-50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <Link
            href="/books"
            className="group inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors hover:text-ink-900"
          >
            <ArrowLeft
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              aria-hidden
            />
            All books
          </Link>

          <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(240px,320px)_1fr] lg:gap-14">
            <div className="mx-auto w-full max-w-xs lg:mx-0 lg:max-w-none">
              <div className="relative">
                <div
                  className="absolute -inset-3 translate-x-3 translate-y-3 border border-gold-500/50"
                  aria-hidden
                />
                <div className="relative aspect-[2/3] overflow-hidden border border-line bg-ink-900 shadow-lift">
                  <BookCover book={book} priority />
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <p className="eyebrow">{categoryLabels[book.category]}</p>

              <h1 className="mt-4 text-[clamp(1.875rem,1.5rem+1.6vw,2.75rem)] leading-[1.15] text-ink-900">
                {book.title}
              </h1>

              <p className="mt-3 text-sm text-ink-700">
                {byAuthor ? "By the author" : "By another author"}{" "}
                <span className="text-muted">· {book.author}</span>
              </p>

              <div className="mt-6 h-px w-16 bg-gold-500/70" aria-hidden />

              <p className="mt-6 max-w-2xl leading-relaxed text-muted">
                {book.description}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setReaderOpen(true)}
                  className="inline-flex min-h-12 items-center gap-2 bg-ink-900 px-6 py-3 text-sm font-medium text-cream-50 transition-colors hover:bg-ink-700"
                >
                  <BookOpen className="h-4 w-4" aria-hidden />
                  Read online
                </button>
                <a
                  href={downloadUrl(book)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center gap-2 border border-ink-900/25 px-6 py-3 text-sm font-medium text-ink-900 transition-colors hover:border-gold-500 hover:text-gold-700"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Download PDF
                </a>
              </div>

              <dl className="mt-10 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2">
                {facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="flex items-center gap-3 bg-paper px-4 py-4"
                  >
                    <fact.icon className="h-4 w-4 shrink-0 text-gold-700" aria-hidden />
                    <div className="min-w-0">
                      <dt className="text-[0.7rem] uppercase tracking-[0.16em] text-muted">
                        {fact.label}
                      </dt>
                      <dd className="mt-0.5 text-sm text-ink-900">{fact.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {more.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line pb-3">
            <h2 className="font-display text-2xl text-ink-900">Also in the library</h2>
            <Link
              href="/books"
              className="group inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors hover:text-ink-900"
            >
              All books
              <ArrowLeft
                className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>

          <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((related, i) => (
              <Reveal key={related.slug} delay={i * 80}>
                <BookCard book={related} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Reader reviews — form first, then what other readers wrote.       */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-t border-line bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="eyebrow">Reader reviews</p>
          <h2 className="mt-3 max-w-[20ch] font-display text-2xl text-ink-900">
            Write a review
          </h2>
          <p className="mt-4 max-w-[56ch] leading-relaxed text-muted">
            Found something worth saying about this book? It appears on the home
            page straight away.
          </p>

          <div className="mt-10 grid gap-12 lg:grid-cols-2">
            <ReviewForm bookSlug={book.slug} />
            <div className="min-w-0">
              {reviews.length > 0 ? (
                <ReviewCarousel reviews={reviews} />
              ) : (
                <p className="text-sm text-muted">No reviews yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {readerOpen && <PdfReader book={book} onClose={() => setReaderOpen(false)} />}
    </>
  );
}