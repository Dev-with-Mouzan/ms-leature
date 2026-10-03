import type { MetadataRoute } from "next";
import { getBooks, getPoems } from "@/lib/api";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const lastModified = new Date();
  const [books, poems] = await Promise.all([getBooks(), getPoems()]);

  return [
    { url: base, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/books`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/poems`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/about`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    ...books.map((book) => ({
      url: `${base}/books/${book.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...poems.map((poem) => ({
      url: `${base}/poems/${poem.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}