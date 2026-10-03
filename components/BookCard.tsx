"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, BookOpen } from "lucide-react";
import type { Book } from "@/lib/books";
import { categoryLabels, downloadUrl } from "@/lib/books";
import BookCover from "@/components/BookCover";
import PdfReader from "@/components/PdfReader";

export default function BookCard({
  book,
  priority = false,
  compact = false,
}: {
  book: Book;
  priority?: boolean;
  /** Tighter variant for dense rows: shorter cover, no description, one CTA. */
  compact?: boolean;
}) {
  const [readerOpen, setReaderOpen] = useState(false);

  return (
    <article className="group flex h-full flex-col border border-line bg-paper transition-colors hover:border-gold-500">
      <Link
        href={`/books/${book.slug}`}
        className={`relative block overflow-hidden border-b border-line bg-ink-900 ${
          compact ? "aspect-[3/4]" : "aspect-[2/3]"
        }`}
        aria-label={`${book.title} — details`}
      >
        <div className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]">
          <BookCover
            book={book}
            priority={priority}
            sizes={
              compact
                ? "(min-width: 1024px) 300px, (min-width: 640px) 300px, 320px"
                : "(min-width: 1024px) 380px, (min-width: 640px) 340px, 320px"
            }
          />
        </div>
      </Link>

      <div className={`flex flex-1 flex-col ${compact ? "p-4" : "p-5"}`}>
        {!compact && <p className="eyebrow">{categoryLabels[book.category]}</p>}

        <h3
          className={`font-display leading-tight text-ink-900 ${
            compact ? "mt-0 text-base" : "mt-2 text-xl"
          }`}
        >
          <Link href={`/books/${book.slug}`} className="transition-colors hover:text-gold-700">
            {book.title}
          </Link>
        </h3>

        <p className={`font-medium text-ink-700 ${compact ? "mt-1 text-xs" : "mt-1.5 text-sm"}`}>
          {book.author}
        </p>

        {!compact && (
          <p className="mt-3 line-clamp-4 text-[0.9375rem] leading-relaxed text-muted">
            {book.description}
          </p>
        )}

        {compact ? (
          <button
            type="button"
            onClick={() => setReaderOpen(true)}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap bg-ink-900 px-4 py-2 text-[0.8125rem] font-medium text-cream-50 transition-colors hover:bg-ink-700"
          >
            <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
            Read online
          </button>
        ) : (
          <div className="mt-auto flex flex-wrap gap-2 pt-5">
            <button
              type="button"
              onClick={() => setReaderOpen(true)}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap bg-ink-900 px-4 py-2.5 text-sm font-medium text-cream-50 transition-colors hover:bg-ink-700"
            >
              <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
              Read online
            </button>
            <a
              href={downloadUrl(book)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap border border-ink-900/25 px-4 py-2.5 text-sm font-medium text-ink-900 transition-colors hover:border-gold-500 hover:text-gold-700"
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden />
              Download PDF
            </a>
          </div>
        )}
      </div>

      {readerOpen && <PdfReader book={book} onClose={() => setReaderOpen(false)} />}
    </article>
  );
}