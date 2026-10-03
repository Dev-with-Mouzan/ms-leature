/** Route-level loading skeleton (shown while a route resolves). */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-3 w-24 animate-pulse bg-cream-200" aria-hidden />
      <div className="mt-5 h-10 w-64 animate-pulse bg-cream-200" aria-hidden />
      <div className="mt-4 h-4 w-96 max-w-full animate-pulse bg-cream-100" aria-hidden />
      {/* Matches the real book grid (2-up) so nothing shifts on resolve. */}
      <div className="mt-12 grid gap-7 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="aspect-[2/3] w-full animate-pulse border border-line bg-cream-100"
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}
