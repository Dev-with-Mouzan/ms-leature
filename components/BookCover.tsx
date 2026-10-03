import Image from "next/image";
import type { Book } from "@/lib/books";
import { categoryLabels } from "@/lib/books";

/**
 * Book cover. Uses the real cover photograph when one exists; otherwise a
 * designed typographic cover keeps the library visually consistent.
 */
export default function BookCover({
  book,
  className = "",
  priority = false,
  sizes = "(min-width: 1024px) 380px, (min-width: 640px) 340px, 320px",
}: {
  book: Book;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (book.coverImage) {
    return (
      <Image
        src={book.coverImage}
        alt={`${book.title} — cover`}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`relative flex h-full w-full flex-col justify-between overflow-hidden bg-ink-900 px-5 py-6 text-cream-50 ${className}`}
      role="img"
      aria-label={`${book.title} — cover`}
    >
      {/* Cloth texture + spine shade */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 7px)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 start-0 w-4 bg-gradient-to-r from-black/50 via-black/10 to-transparent"
        aria-hidden
      />
      {/* Gold frame */}
      <div
        className="pointer-events-none absolute inset-3 border border-gold-500/45"
        aria-hidden
      />

      <p className="eyebrow eyebrow-light relative">{categoryLabels[book.category]}</p>

      <div className="relative text-center">
        <p className="font-display text-[clamp(1.25rem,1rem+1.4vw,1.75rem)] leading-tight text-cream-50">
          {book.title}
        </p>
        <div className="mx-auto my-4 h-px w-12 bg-gold-500/70" aria-hidden />
        <p className="text-sm text-cream-300/85">{book.author}</p>
      </div>

      <p className="relative text-xs uppercase tracking-[0.18em] text-cream-300/70">
        {book.publishedYear ?? "Library edition"}
      </p>
    </div>
  );
}