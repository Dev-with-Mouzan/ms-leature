import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { books, getBookBySlug, categoryLabels } from "@/lib/books";
import { getReviewsForBook } from "@/lib/reviews";
import { siteConfig } from "@/lib/site";
import BookDetailView from "@/components/views/BookDetailView";

type Params = { params: Promise<{ slug: string }> };

/** Reader reviews are live data, so pages revalidate every minute. */
export const revalidate = 60;

export function generateStaticParams() {
  return books.map((book) => ({ slug: book.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) return { title: "Book not found" };

  // Trim to a clean sentence-ish length for the meta description.
  const description =
    book.description.length > 180
      ? `${book.description.slice(0, 177).replace(/\s+\S*$/, "")}…`
      : book.description;

  const byAuthor = book.author === siteConfig.author.name;
  const title = book.title;

  return {
    title,
    description,
    keywords: [book.title, book.author, categoryLabels[book.category], "Urdu poetry"],
    alternates: { canonical: `/books/${book.slug}` },
    openGraph: {
      // `book` is a valid OG type but renders no card on most platforms;
      // `article` gives a reliable card. Book schema still ships in JSON-LD.
      type: "article",
      title,
      description,
      authors: [book.author],
      url: `/books/${book.slug}`,
      siteName: siteConfig.author.name,
      ...(book.coverImage
        ? { images: [{ url: book.coverImage, alt: `${book.title} — cover` }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(book.coverImage ? { images: [book.coverImage] } : {}),
    },
    other: {
      "books:author": byAuthor ? siteConfig.author.name : book.author,
    },
  };
}

export default async function BookDetailPage({ params }: Params) {
  const { slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) notFound();

  const byAuthor = book.author === siteConfig.author.name;
  const reviews = await getReviewsForBook(book.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Book",
        "@id": `${siteConfig.url}/books/${book.slug}#book`,
        name: book.title,
        description: book.description,
        author: {
          "@type": "Person",
          name: book.author,
          ...(byAuthor ? { sameAs: siteConfig.author.affiliation.directory } : {}),
        },
        inLanguage: "ur",
        genre: categoryLabels[book.category],
        ...(book.coverImage ? { image: `${siteConfig.url}${book.coverImage}` } : {}),
        ...(book.publishedYear ? { datePublished: String(book.publishedYear) } : {}),
        ...(book.pages ? { numberOfPages: book.pages } : {}),
        isAccessibleForFree: true,
        url: `${siteConfig.url}/books/${book.slug}`,
        mainEntityOfPage: { "@id": `${siteConfig.url}/books/${book.slug}` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteConfig.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Books",
            item: `${siteConfig.url}/books`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: book.title,
            item: `${siteConfig.url}/books/${book.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BookDetailView book={book} reviews={reviews} />
    </>
  );
}