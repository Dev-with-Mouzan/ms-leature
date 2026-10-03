import { redirect } from "next/navigation";

import { setAdminToken } from "@/lib/admin";

const BASE = (process.env.FASTAPI_URL ?? "http://localhost:8000").replace(/\/$/, "");

export default function AdminLoginPage() {
  async function login(formData: FormData) {
    "use server";

    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const res = await fetch(`${BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    });

    if (!res.ok) {
      // Keep the message generic — the API already returns "Wrong username or password."
      throw new Error("Login failed");
    }

    const data = (await res.json()) as { token?: string };
    if (!data.token) {
      throw new Error("Login failed");
    }

    await setAdminToken(data.token);
    redirect("/admin");
  }

  return (
    <section className="mx-auto max-w-sm px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="font-display text-2xl text-ink-900">Admin sign in</h1>
      <form action={login} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="username" className="text-sm text-ink-900">
            Username
          </label>
          <input
            id="username"
            name="username"
            className="min-h-11 rounded border border-line px-3 text-sm"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm text-ink-900">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="min-h-11 rounded border border-line px-3 text-sm"
            required
          />
        </div>
        <button
          type="submit"
          className="mt-2 min-h-11 rounded bg-ink-900 px-4 text-sm text-gold-400"
        >
          Sign in
        </button>
      </form>
    </section>
  );
}