import { redirect } from "next/navigation";

import { getAdminToken } from "@/lib/admin";
import { getBooks, getPoems } from "@/lib/api";

export default async function AdminPage() {
  const token = await getAdminToken();
  if (!token) {
    redirect("/admin/login");
  }

  const [books, poems] = await Promise.all([getBooks(), getPoems()]);

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="font-display text-2xl text-ink-900">Admin</h1>
      <p className="mt-2 text-sm text-muted">Manage books and poems.</p>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div className="border border-line p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg text-ink-900">Books</h2>
            <a href="/admin/books" className="text-sm text-gold-700">
              Manage →
            </a>
          </div>
          <p className="mt-2 text-sm text-muted">{books.length} book(s)</p>
        </div>
        <div className="border border-line p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg text-ink-900">Poems</h2>
            <a href="/admin/poems" className="text-sm text-gold-700">
              Manage →
            </a>
          </div>
          <p className="mt-2 text-sm text-muted">{poems.length} poem(s)</p>
        </div>
      </div>
    </section>
  );
}