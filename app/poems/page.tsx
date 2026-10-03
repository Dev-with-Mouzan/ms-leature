import { getPoems } from "@/lib/api";
import Reveal from "@/components/Reveal";

export default async function PoemsPage() {
  const poems = await getPoems();

  return (
    <section>
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="eyebrow">Poems</p>
        <h1 className="mt-3 max-w-[20ch] font-display text-3xl text-ink-900 sm:text-4xl">
          Shar of Poetry
        </h1>
        <p className="mt-4 max-w-[56ch] leading-relaxed text-muted">
          Selected poems published here. New verses will appear as they are added.
        </p>

        {poems.length === 0 ? (
          <p className="mt-10 text-sm text-muted">No poems yet.</p>
        ) : (
          <ul className="mt-10 divide-y divide-line">
            {poems.map((poem, i) => (
              <li key={poem.slug} className="py-6 first:pt-0 last:pb-0">
                <Reveal delay={i * 40}>
                  <a
                    href={`/poems/${poem.slug}`}
                    className="group block"
                  >
                    <h2 className="font-display text-xl text-ink-900 transition-colors group-hover:text-gold-700">
                      {poem.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                      {poem.body}
                    </p>
                  </a>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}