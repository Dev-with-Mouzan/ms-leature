import { notFound } from "next/navigation";
import { getPoem, getPoems } from "@/lib/api";

type Params = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const poem = await getPoem(slug);
  if (!poem) return { title: "Poem not found" };
  const description =
    poem.body.length > 160 ? `${poem.body.slice(0, 157)}…` : poem.body;
  return {
    title: poem.title,
    description,
    alternates: { canonical: `/poems/${poem.slug}` },
  };
}

export default async function PoemDetailPage({ params }: Params) {
  const { slug } = await params;
  const poem = await getPoem(slug);
  if (!poem) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="font-display text-3xl text-ink-900 sm:text-4xl">
        {poem.title}
      </h1>
      <div className="mt-8 whitespace-pre-wrap leading-relaxed text-ink-900">
        {poem.body}
      </div>
    </article>
  );
}