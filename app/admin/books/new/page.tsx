import { redirect } from "next/navigation";

import { adminFetch, getAdminToken } from "@/lib/admin";

export default async function NewBookPage() {
  const token = await getAdminToken();
  if (!token) redirect("/admin/login");

  async function createBook(formData: FormData) {
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
      await adminFetch("/books", { method: "POST", body: JSON.stringify(payload) });
    } catch (err) {
      console.error(err);
    }
    redirect("/admin/books");
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="font-display text-2xl text-ink-900">New book</h1>
      <form action={createBook} className="mt-8 grid gap-4">
        {[
          ["title", "Title", "text"],
          ["slug", "Slug (optional)", "text"],
          ["description", "Description", "textarea"],
          ["coverImage", "Cover image path (/images/...) or URL", "text"],
          ["pdfUrl", "PDF URL", "text"],
          ["category", "Category (poetry/criticism/essays/research/other)", "text"],
          ["author", "Author", "text"],
          ["publishedYear", "Published year", "number"],
          ["pages", "Pages", "number"],
          ["publication", "Publication", "text"],
          ["sortOrder", "Sort order", "number"],
        ].map(([name, label, type]) => (
          <div key={name as string} className="flex flex-col gap-2">
            <label htmlFor={name as string} className="text-sm">
              {label}
            </label>
            {type === "textarea" ? (
              <textarea
                id={name as string}
                name={name as string}
                rows={4}
                className="min-h-11 rounded border border-line px-3 py-2 text-sm"
              />
            ) : (
              <input
                id={name as string}
                name={name as string}
                type={type as string}
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