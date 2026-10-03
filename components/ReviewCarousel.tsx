"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// Type-only import: erased at build time, so this client component does not
// pull in the server-only data module.
import type { Review } from "@/lib/api";

const ADVANCE_MS = 4000;
const GAP_PX = 24;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function ReviewCarousel({ reviews }: { reviews: Review[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  const advance = useCallback(() => {
    const track = trackRef.current;
    const card = track?.firstElementChild;
    if (!track || !(card instanceof HTMLElement)) return;

    const end = track.scrollLeft + card.offsetWidth + GAP_PX;
    const max = track.scrollWidth - track.clientWidth;
    track.scrollTo({
      left: end >= max ? 0 : end,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, []);

  useEffect(() => {
    if (reviews.length <= 4 || paused || prefersReducedMotion()) return;
    const timer = setInterval(advance, ADVANCE_MS);
    return () => clearInterval(timer);
  }, [advance, paused, reviews.length]);

  if (reviews.length === 0) return null;

  return (
    <div
      ref={trackRef}
      role="region"
      aria-label="Reader reviews"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2"
    >
      {reviews.map((review) => (
        <figure
          key={review.id}
          className="w-[85%] shrink-0 snap-start border border-line bg-cream-50 p-6 sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-0.75rem)]"
        >
          <blockquote className="text-[0.9375rem] leading-relaxed text-ink-900">
            {review.body}
          </blockquote>
          <figcaption className="mt-5 border-t border-line pt-4">
            <p className="text-sm font-medium text-ink-900">{review.name}</p>
            <Link
              href={`/books/${review.bookSlug}`}
              className="mt-1 block text-xs text-muted underline decoration-gold-500 underline-offset-4 transition-colors hover:text-gold-700"
            >
              {review.bookTitle}
            </Link>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}