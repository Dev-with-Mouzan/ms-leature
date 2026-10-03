import { categoryLabels } from "@/lib/books";
import { getBooks, getPoems } from "@/lib/api";
import { siteConfig } from "@/lib/site";

/**
 * llms.txt — a plain-text map of the site for AI crawlers.
 * See https://llmstxt.org. Regenerated from the backend so it cannot drift.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const { author, url } = siteConfig;
  const [books, poems] = await Promise.all([getBooks(), getPoems()]);
  const own = books.filter((b) => b.author === author.name);
  const others = books.filter((b) => b.author !== author.name);

  const body = `# ${author.fullName}

> ${author.title}, ${author.affiliation.department}, ${author.affiliation.name}
> (${author.affiliation.parent}). Urdu poet and writer.
> ${author.credentials}. At the college since ${author.atCollegeSince};
> ${author.title} since ${author.associateProfessorSince}.

All books below are free to read online in the browser or download as PDF.
Written in English. All his poetry is in Urdu.

## Pages
- [Home](${url}/): Introduction and featured book.
- [About](${url}/about): Biography, academic record, literary work, publications.
- [Books](${url}/books): The full library.
- [Poems](${url}/poems): Poems published here.
- [Contact](${url}/contact): Email and contact form.

## Books by ${author.name}
${own.map((b) => `- [${b.title}](${url}/books/${b.slug}) — ${categoryLabels[b.category]}.`).join("\n") || "- None at the moment."}

## Related reading (by others)
About, or with a contribution from, ${author.name}. Not his own work.
${others.map((b) => `- [${b.title}](${url}/books/${b.slug}) — ${categoryLabels[b.category]}, by ${b.author}.`).join("\n") || "- None at the moment."}

## Poems
${poems.map((p) => `- [${p.title}](${url}/poems/${p.slug})`).join("\n") || "- None at the moment."}

## Affiliation
- [${author.affiliation.name}](${author.affiliation.url}) — ${author.affiliation.address}
- [Staff directory entry](${author.affiliation.directory})

## Optional
- [sitemap.xml](${url}/sitemap.xml)
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}