import { redirect } from "next/navigation";

import { adminFetch, clearAdminToken, getAdminToken } from "@/lib/admin";
import { getBooks } from "@/lib/api";
import type { Book } from "@/lib/books";

export default async function AdminBooksPage() {
  const token = await getAdminToken();
  if (!token) redirect("/admin/login");

  const books = await getBooks();

  async function deleteBook(formData: FormData) {
    "use server";
    const slug = String(formData.get("slug") ?? "");
    try {
      await adminFetch(`/books/${encodeURIComponent(slug)}`, { method: "DELETE" });
    } catch (err) {
      console.error(err);
    }
    redirect("/admin/books");
  }

  async function logout() {
    "use server";
    await clearAdminToken();
    redirect("/admin/login");
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-2xl text-ink-900">Books</h1>
        <div className="flex gap-4">
          <a href="/admin/books/new" className="text-sm text-gold-700">
            Add book
          </a>
          <form action={logout}>
            <button type="submit" className="text-sm text-muted">
              Sign out
            </button>
          </form>
        </div>
      </div>

      <ul className="mt-8 divide-y divide-line">
        {books.map((book: Book) => (
          <li key={book.slug} className="flex items-center justify-between gap-4 py-4">
            <div>
              <a href={`/books/${book.slug}`} className="font-medium text-ink-900">
                {book.title}
              </a>
              <p className="text-sm text-muted">{book.slug}</p>
            </div>
            <div className="flex gap-3">
              <a href={`/admin/books/${encodeURIComponent(book.slug)}/edit`} className="text-sm">
                Edit
              </a>
              <form action={deleteBook}>
                <input type="hidden" name="slug" value={book.slug} />
                <button type="submit" className="text-sm text-red-600">
                  Delete
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}