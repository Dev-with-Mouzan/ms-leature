import { notFound, redirect } from "next/navigation";

import { adminFetch, getAdminToken } from "@/lib/admin";
import { getBook } from "@/lib/api";

type Params = { params: Promise<{ slug: string }> };

export default async function EditBookPage({ params }: Params) {
  const { slug } = await params;
  const token = await getAdminToken();
  if (!token) redirect("/admin/login");

  const book = await getBook(slug);
  if (!book) notFound();

  async function updateBook(formData: FormData) {
    "use server";
    const payload: Record<string, unknown> = {};
    for (const [k, v] of formData.entries()) {
      if (v instanceof File) continue;
      const val = v.toString();
      if (val === "") continue;
      if (k === "publishedYear" || k === "pages" || k === "sortOrder") {
        const n = Number(val);
        if (!Number.isNaN(n)) payload[k] = n;
      } else {
        payload[k] = val;
      }
    }
    try {
      await adminFetch(`/books/${encodeURIComponent(slug)}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error(err);
    }
    redirect("/admin/books");
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="font-display text-2xl text-ink-900">Edit book</h1>
      <form action={updateBook} className="mt-8 grid gap-4">
        {[
          ["title", "Title", "text", book.title],
          ["slug", "Slug", "text", book.slug],
          ["description", "Description", "textarea", book.description],
          ["coverImage", "Cover image path or URL", "text", book.coverImage ?? ""],
          ["pdfUrl", "PDF URL", "text", book.pdfUrl],
          ["category", "Category", "text", book.category],
          ["author", "Author", "text", book.author],
          ["publishedYear", "Published year", "number", book.publishedYear ?? ""],
          ["pages", "Pages", "number", book.pages ?? ""],
          ["publication", "Publication", "text", book.publication ?? ""],
          ["sortOrder", "Sort order", "number", book.sortOrder ?? 0],
        ].map(([name, label, type, val]) => (
          <div key={name as string} className="flex flex-col gap-2">
            <label htmlFor={name as string} className="text-sm">
              {label}
            </label>
            {type === "textarea" ? (
              <textarea
                id={name as string}
                name={name as string}
                rows={4}
                defaultValue={val as string}
                className="min-h-11 rounded border border-line px-3 py-2 text-sm"
              />
            ) : (
              <input
                id={name as string}
                name={name as string}
                type={type as string}
                defaultValue={val as any}
                className="min-h-11 rounded border border-line px-3 text-sm"
              />
            )}
          </div>
        ))}
        <button type="submit" className="mt-4 min-h-11 rounded bg-ink-900 px-4 text-sm text-gold-400">
          Save
        </button>
      </form>
    </section>
  );
}