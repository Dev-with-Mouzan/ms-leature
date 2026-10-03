import { getBooks } from "@/lib/api";
import { siteConfig } from "@/lib/site";
import BookCard from "@/components/BookCard";
import Reveal from "@/components/Reveal";

/**
 * The library. No category filter: with three titles it would split the grid
 * into one- and two-item buckets, which reads as a broken search. The grid is
 * split instead by authorship, which is the distinction that actually matters
 * here — two of the three titles are by other authors.
 */
export default async function BooksView() {
  const books = await getBooks();
  const own = books.filter((b) => b.author === siteConfig.author.name);
  const related = books.filter((b) => b.author !== siteConfig.author.name);

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="eyebrow">The library</p>
          <h1 className="mt-3 text-[clamp(2.25rem,1.8rem+2vw,3.25rem)] leading-[1.1] text-ink-900">
            Books
          </h1>
          <div className="mt-4 h-px w-16 bg-gold-500/70" aria-hidden />
          <p className="mt-5 max-w-2xl leading-relaxed text-muted">
            Every title here can be read in the browser or downloaded as a PDF,
            free of charge. Books by {siteConfig.author.name} are listed first;
            titles about his work, or to which he contributed, follow.
          </p>
        </div>
      </section>

      <section className="bg-cream-50">
        <div className="mx-auto max-w-6xl space-y-14 px-4 py-14 sm:px-6 sm:py-20">
          <Group title={`By ${siteConfig.author.name}`} books={own} />

          {related.length > 0 && (
            <Group
              title="Related reading"
              note="By other authors — about his work, or with his contribution."
              books={related}
            />
          )}
        </div>
      </section>
    </>
  );
}

function Group({
  title,
  note,
  books: list,
}: {
  title: string;
  note?: string;
  books: typeof books;
}) {
  if (list.length === 0) return null;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line pb-3">
        <h2 className="text-lg text-ink-900">{title}</h2>
        <p className="text-sm text-muted">
          {note ?? `${list.length} ${list.length === 1 ? "title" : "titles"}`}
        </p>
      </div>

      <div className="mt-8 grid gap-7 sm:grid-cols-2">
        {list.map((book, i) => (
          <Reveal key={book.id} delay={Math.min(i, 2) * 80}>
            <BookCard book={book} priority={i === 0} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}