"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

import type { Book } from "@/lib/books";
import { categoryLabels } from "@/lib/books";
import BookCover from "@/components/BookCover";
import PdfReader from "@/components/PdfReader";

/**
 * The featured book on the home page. Client-side because "Read online"
 * opens the in-site reader in place — no navigation away from the home page.
 */
export default function FeaturedBook({ book }: { book: Book }) {
  const [readerOpen, setReaderOpen] = useState(false);

  return (
    <>
      <div className="grid gap-12 lg:grid-cols-[minmax(260px,340px)_1fr] lg:gap-16">
        <div className="relative mx-auto max-w-[16rem] lg:mx-0 lg:max-w-none">
          <div
            className="absolute -inset-3 translate-x-3 translate-y-3 border border-gold-500/50"
            aria-hidden
          />
          <div className="relative aspect-[2/3] overflow-hidden border border-line bg-ink-900 shadow-lift">
            <BookCover book={book} priority />
          </div>

          {/* Top-left corner, hanging half off the photo. Sits fully on the cover
              below `sm`, where there is no room left to overhang. */}
          <span className="absolute left-0 top-3.5 z-10 rounded-full bg-ink-900/95 px-3.5 py-1.5 text-[0.65rem] uppercase tracking-[0.16em] text-gold-300 shadow-lift sm:-translate-x-1/2">
            Recent update
          </span>
        </div>

        <div className="min-w-0">
          <p className="eyebrow">{categoryLabels[book.category]}</p>
          <h2 className="mt-3 max-w-[20ch] text-[clamp(1.875rem,1.5rem+1.6vw,2.75rem)] leading-[1.12] text-ink-900">
            {book.title}
          </h2>
          <div className="mt-5 h-px w-16 bg-gold-500/70" aria-hidden />
          <p className="mt-6 max-w-[58ch] leading-relaxed text-muted">
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
            <Link
              href={`/books/${book.slug}`}
              className="group inline-flex min-h-12 items-center gap-2 border border-ink-900/25 px-6 py-3 text-sm font-medium text-ink-900 transition-colors hover:border-gold-500 hover:text-gold-700"
            >
              Book details
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>
        </div>
      </div>

      {readerOpen && <PdfReader book={book} onClose={() => setReaderOpen(false)} />}
    </>
  );
}