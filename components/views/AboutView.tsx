import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import { getBooks } from "@/lib/api";
import { categoryLabels } from "@/lib/books";
import { siteConfig } from "@/lib/site";
import Reveal from "@/components/Reveal";

export default async function AboutView() {
  const { author } = siteConfig;
  const books = await getBooks();
  const own = books.filter((b) => b.author === author.name);

  const record = [
    { term: "Name", detail: author.fullName },
    { term: "Qualification", detail: author.credentials },
    { term: "Post", detail: author.title },
    { term: "Appointed", detail: `Associate Professor since ${author.associateProfessorSince}` },
    { term: "At the college since", detail: String(author.atCollegeSince) },
    { term: "Department", detail: author.affiliation.department },
  ];

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Opening                                                          */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-line bg-cream-50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="text-center">
            <p className="eyebrow">About</p>
            <h1 className="mx-auto mt-3 max-w-[22ch] text-[clamp(2.25rem,1.8rem+2vw,3.25rem)] leading-[1.08] text-ink-900">
              A poet who teaches English, and writes in Urdu.
            </h1>
            <div className="mx-auto mt-5 h-px w-20 bg-gold-500/70" aria-hidden />
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(240px,320px)_1fr] lg:gap-16">
            <figure className="lg:sticky lg:top-28 lg:self-start">
              <div className="relative aspect-[4/5] overflow-hidden border border-line bg-ink-900 shadow-lift">
                <Image
                  src={author.portrait}
                  alt={`${author.name}, ${author.title}`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 320px, 320px"
                  className="object-cover object-top"
                />
              </div>
              <figcaption className="mt-3 border-t border-line pt-3 text-sm text-muted">
                {author.name}
              </figcaption>
            </figure>

            <div className="max-w-[62ch] space-y-5 leading-relaxed text-muted">
              <p>
                <span className="text-ink-900">{author.fullName}</span> —{" "}
                {author.name} to most people — writes Urdu poetry. His poems
                start from what is in front of him: a street, a classroom, people
                going past. He does not reach for the grand image first; the
                ordinary scene does the work, and the feeling arrives after.
              </p>
              <p>
                Alongside writing, he is {author.title} at{" "}
                {author.affiliation.name} in{" "}
                {author.affiliation.address.split(", ").slice(1).join(", ")} —{" "}
                {author.affiliation.name} sits under the {author.affiliation.parent}.
                He has taught in the Department of English there since{" "}
                {author.atCollegeSince}, and has held the Associate Professor post
                since {author.associateProfessorSince}. He holds an{" "}
                {author.credentials}.
              </p>
              <p>
                His poetry collection{" "}
                <Link
                  href="/books/magar-manzar-nahi-mera"
                  className="text-ink-900 underline decoration-gold-500/50 underline-offset-4 transition-colors hover:text-gold-700"
                >
                  Magar Manzar Nahi Mera
                </Link>{" "}
                is free to read in full on this site, as a PDF download or in the
                browser. He has also contributed to{" "}
                <Link
                  href="/books/the-listening-eye-the-seeing-heart"
                  className="text-ink-900 underline decoration-gold-500/50 underline-offset-4 transition-colors hover:text-gold-700"
                >
                  The Listening Eye, the Seeing Heart
                </Link>
                , and is the subject of a critical study by Ghazala Anjum, also
                listed in the library.
              </p>
              <p className="border-s-2 border-gold-500 ps-5 text-ink-800">
                This site carries no biography he has not written or confirmed.
                What appears here is drawn from the college&apos;s own staff
                directory and from the books themselves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Academic record                                                 */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="text-center">
            <p className="eyebrow">Record</p>
            <h2 className="mt-3 text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)] leading-[1.15] text-ink-900">
              Academic record
            </h2>
            <div className="mx-auto mt-4 h-px w-16 bg-gold-500/70" aria-hidden />
          </div>

          <dl className="mt-10 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {record.map((item) => (
              <div key={item.term} className="bg-paper px-5 py-5">
                <dt className="text-[0.7rem] uppercase tracking-[0.16em] text-muted">
                  {item.term}
                </dt>
                <dd className="mt-1.5 text-sm text-ink-900">{item.detail}</dd>
              </div>
            ))}
          </dl>

          <a
            href={author.affiliation.directory}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors hover:text-gold-700"
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
            Source: {author.affiliation.name} staff directory
          </a>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Literary work                                                   */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-line bg-cream-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="text-center">
            <p className="eyebrow">Writing</p>
            <h2 className="mt-3 text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)] leading-[1.15] text-ink-900">
              In the library
            </h2>
            <div className="mx-auto mt-4 h-px w-16 bg-gold-500/70" aria-hidden />
          </div>

          <ul className="mt-10 divide-y divide-line border-y border-line">
            {own.map((book) => (
              <li key={book.slug}>
                <Link
                  href={`/books/${book.slug}`}
                  className="group flex flex-col gap-1 py-5 transition-colors sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                >
                  <span className="font-display text-xl text-ink-900 transition-colors group-hover:text-gold-700">
                    {book.title}
                  </span>
                  <span className="flex shrink-0 items-center gap-4 text-sm text-muted">
                    <span>{categoryLabels[book.category]}</span>
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <Reveal>
            <Link
              href="/books"
              className="mt-8 inline-flex min-h-12 items-center gap-2 border-b border-gold-500 pb-1 text-sm font-medium text-ink-900 transition-colors hover:text-gold-700"
            >
              Everything in the library
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Affiliation                                                     */}
      {/* ---------------------------------------------------------------- */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
            <div className="text-center">
              <p className="eyebrow">Teaching</p>
              <h2 className="mt-3 text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)] leading-[1.15] text-ink-900">
                Where he teaches
              </h2>
              <div className="mx-auto mt-4 h-px w-16 bg-gold-500/70" aria-hidden />
            </div>
            <div className="max-w-[62ch] leading-relaxed text-muted">
              <p>
                The Department of English at {author.affiliation.name},{" "}
                {author.affiliation.address}. The college falls under the{" "}
                {author.affiliation.parent}.
              </p>
              <p className="mt-4">
                Visitors looking for official contact details or a staff record
                will find both on the college&apos;s own pages.
              </p>
              <Link
                href="/contact"
                className="group mt-8 inline-flex min-h-12 items-center gap-2 border-b border-gold-500 pb-1 text-sm font-medium text-ink-900 transition-colors hover:text-gold-700"
              >
                Write to {author.name}
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}