import type { Metadata } from "next";
import BooksView from "@/components/views/BooksView";
import { siteConfig } from "@/lib/site";

const description = `Read books by and about ${siteConfig.author.name} online, or download them free as PDF — Urdu poetry, criticism and literary writing.`;

export const metadata: Metadata = {
  title: "Books",
  description,
  alternates: { canonical: "/books" },
  openGraph: {
    type: "website",
    title: `Books · ${siteConfig.author.name}`,
    description,
    url: "/books",
  },
};

export default function BooksPage() {
  return <BooksView />;
}