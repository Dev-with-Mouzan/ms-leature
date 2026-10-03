import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you are looking for may have moved or never existed.",
};

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-[clamp(2rem,1.6rem+1.6vw,2.75rem)] leading-tight text-ink-900">
        Page not found
      </h1>
      <div className="mt-5 h-px w-16 bg-gold-500/70" aria-hidden />
      <p className="mt-6 max-w-md leading-relaxed text-muted">
        The page you are looking for may have moved or never existed. Try the
        library instead.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-12 items-center border border-ink-900/25 px-6 py-3 text-sm font-medium text-ink-900 transition-colors hover:border-gold-500 hover:text-gold-700"
        >
          Home
        </Link>
        <Link
          href="/books"
          className="inline-flex min-h-12 items-center bg-ink-900 px-6 py-3 text-sm font-medium text-cream-50 transition-colors hover:bg-ink-700"
        >
          Books
        </Link>
      </div>
      <p className="mt-10 text-xs uppercase tracking-[0.18em] text-muted">
        {siteConfig.author.name}
      </p>
    </section>
  );
}