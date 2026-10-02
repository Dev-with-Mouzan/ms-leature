import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, ExternalLink } from "lucide-react";

import { books } from "@/lib/books";
import { getReviews } from "@/lib/reviews";
import { siteConfig } from "@/lib/site";
import BookCard from "@/components/BookCard";
import FeaturedBook from "@/components/FeaturedBook";
import ReviewCarousel from "@/components/ReviewCarousel";
import Reveal from "@/components/Reveal";

const own = books.filter((b) => b.author === siteConfig.author.name);
const featured = own[0];
/** All three titles, compact, so the section shows the whole library. */
const library = books;

export default async function HomeView() {
  const { author } = siteConfig;
  const reviews = await getReviews();

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Hero — text left, portrait right. Asymmetric: the text column    */}
      {/* takes the slack, the image column is a fixed 20rem plate.       */}
      {/* Stacks below lg.                                                  */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-line bg-cream-50">
        <div className="mx-auto max-w-6xl px-4 pt-14 pb-14 sm:px-6 sm:pt-20 sm:pb-20">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
            <div>
              <p className="eyebrow">
                Urdu poet · {author.title}
              </p>

              <h1 className="mt-5 max-w-[18ch] text-[clamp(2.5rem,1.7rem+3vw,4.25rem)] leading-[1.02] text-ink-900">
                Poems that begin with what is actually there.
              </h1>

              <div className="mt-6 h-px w-20 bg-gold-500/70" aria-hidden />

              <p className="mt-7 max-w-[58ch] text-lg leading-relaxed text-muted">
                {author.name} writes in Urdu about ordinary scenes — the street,
                the classroom, the people passing through — and is{" "}
                {author.title} at {author.affiliation.name}, where he has taught
                English since {author.atCollegeSince}. His books are free to read
                online, in full.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/books"
                  className="inline-flex min-h-12 items-center gap-2 bg-ink-900 px-6 py-3 text-sm font-medium text-cream-50 transition-colors hover:bg-ink-700"
                >
                  <BookOpen className="h-4 w-4" aria-hidden />
                  Read the books
                </Link>
                <Link
                  href="/about"
                  className="group inline-flex min-h-12 items-center gap-2 border border-ink-900/25 px-6 py-3 text-sm font-medium text-ink-900 transition-colors hover:border-gold-500 hover:text-gold-700"
                >
                  Biography
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </div>
            </div>

            <figure className="w-full max-w-[20rem] lg:max-w-none lg:sticky lg:top-28">
              <div className="relative aspect-[4/5] w-full overflow-hidden border border-line bg-ink-900 shadow-lift">
                <Image
                  src={author.portrait}
                  alt={`${author.name}, ${author.title}`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 320px, (min-width: 640px) 384px, 320px"
                  className="object-cover object-top"
                />
              </div>
              <figcaption className="mt-4 border-t border-line pt-3 text-sm leading-relaxed text-muted">
                {author.fullName} — {author.affiliation.name},{" "}
                {author.affiliation.address}.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Ledger — facts, not adjectives                                */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-line bg-paper">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-line px-0 sm:px-6 lg:grid-cols-4">
          {[
            { term: "Books free to read", detail: `${books.length} in the library` },
            { term: "Language", detail: "Urdu" },
            { term: "Teaching since", detail: String(author.atCollegeSince) },
            { term: "Post", detail: `${author.title}, since ${author.associateProfessorSince}` },
          ].map((item) => (
            <div key={item.term} className="bg-paper px-4 py-6 sm:px-6">
              <dt className="text-[0.7rem] uppercase tracking-[0.16em] text-muted">
                {item.term}
              </dt>
              <dd className="mt-1.5 text-sm text-ink-900">{item.detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Featured book                                                   */}
      {/* ---------------------------------------------------------------- */}
      {featured && (
        <section className="border-b border-line bg-cream-50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <FeaturedBook book={featured} />
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Affiliation band — ink. Every value comes from siteConfig, so this  */}
      {/* stays true when the book and article list changes.                  */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-ink-900">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="eyebrow eyebrow-light">Where the teaching happens</p>
          <p className="mt-6 max-w-[28ch] font-display text-[clamp(1.75rem,1.2rem+2.4vw,3rem)] leading-[1.2] text-cream-50">
            {siteConfig.author.affiliation.department},{" "}
            {siteConfig.author.affiliation.name}.
          </p>
          <div className="mt-8 h-px w-16 bg-gold-400/70" aria-hidden />
          <p className="mt-6 max-w-[58ch] leading-relaxed text-cream-200/85">
            {siteConfig.author.affiliation.parent}.{" "}
            {siteConfig.author.affiliation.address}.
          </p>
          <a
            href={siteConfig.author.affiliation.directory}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-gold-300 underline decoration-gold-400/50 underline-offset-4 transition-colors hover:text-cream-50"
          >
            College staff directory
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
          </a>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Also in the library                                             */}
      {/* ---------------------------------------------------------------- */}
      {library.length > 0 && (
        <section className="border-b border-line">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line pb-3">
              <h2 className="font-display text-xl text-ink-900">
                Also in the library
              </h2>
              <p className="text-sm text-muted">{books.length} titles</p>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {library.map((book, i) => (
                <Reveal key={book.id} delay={i * 80}>
                  <BookCard book={book} compact />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Reader reviews — placed before the closing CTA on purpose.       */}
      {/* ---------------------------------------------------------------- */}
      {reviews.length > 0 && (
        <section className="border-b border-line bg-paper">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <p className="eyebrow">From readers</p>
            <h2 className="mt-3 max-w-[24ch] text-[clamp(1.75rem,1.4rem+1.6vw,2.75rem)] leading-[1.12] text-ink-900">
              What people say
            </h2>
            <p className="mt-5 max-w-[56ch] leading-relaxed text-muted">
              Reviews left by visitors. Every title in the library stays free to
              read.
            </p>
            <div className="mt-10">
              <ReviewCarousel reviews={reviews} />
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Closing CTA                                                     */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-cream-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="eyebrow">Write</p>
          <h2 className="mt-3 max-w-[20ch] text-[clamp(1.75rem,1.4rem+1.6vw,2.75rem)] leading-[1.12] text-ink-900">
            Literary conversations are welcome.
          </h2>
          <p className="mt-5 max-w-[56ch] leading-relaxed text-muted">
            Invitations, interviews, teaching questions or a disagreement about a
            poem — the contact page reaches the author directly.
          </p>
          <Link
            href="/contact"
            className="group mt-8 inline-flex min-h-12 items-center gap-2 border-b border-gold-500 pb-1 text-sm font-medium text-ink-900 transition-colors hover:text-gold-700"
          >
            Get in touch
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
          <p className="mt-10 flex items-center gap-2 text-sm text-muted">
            <ExternalLink className="h-4 w-4 shrink-0 text-gold-700" aria-hidden />
            {author.affiliation.name} —{" "}
            <a
              href={author.affiliation.directory}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-gold-500/40 underline-offset-4 transition-colors hover:text-gold-700"
            >
              staff directory entry
            </a>
          </p>
        </div>
      </section>
    </>
  );
}