"use client";

import { useEffect } from "react";
import Link from "next/link";

/** Graceful route error boundary. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <p className="eyebrow">Error</p>
      <h1 className="mt-4 text-[clamp(2rem,1.6rem+1.6vw,2.75rem)] leading-tight text-ink-900">
        Something went wrong
      </h1>
      <div className="mt-5 h-px w-16 bg-gold-500/70" aria-hidden />
      <p className="mt-6 max-w-md leading-relaxed text-muted">
        The page could not be loaded. Please try again — or return to the library.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-12 items-center bg-ink-900 px-6 py-3 text-sm font-medium text-cream-50 transition-colors hover:bg-ink-700"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex min-h-12 items-center border border-ink-900/25 px-6 py-3 text-sm font-medium text-ink-900 transition-colors hover:border-gold-500 hover:text-gold-700"
        >
          Home
        </Link>
      </div>
    </section>
  );
}