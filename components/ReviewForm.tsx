"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type State =
  | { status: "idle"; error?: string }
  | { status: "busy" }
  | { status: "sent" };

export default function ReviewForm({ bookSlug }: { bookSlug: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(
      new FormData(form).entries(),
    ) as Record<string, string>;

    setState({ status: "busy" });
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book_slug: bookSlug,
          author_name: fields.author_name ?? "",
          body: fields.body ?? "",
          website: fields.website ?? "",
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setState({
          status: "idle",
          error: payload.error ?? "Something went wrong.",
        });
        return;
      }

      form.reset();
      setState({ status: "sent" });
      router.refresh();
    } catch {
      setState({ status: "idle", error: "Network error. Please try again." });
    }
  }

  if (state.status === "sent") {
    return (
      <p className="border border-gold-500/60 bg-cream-50 p-5 text-sm text-ink-900">
        Thank you &mdash; your review is published.
      </p>
    );
  }

  const busy = state.status === "busy";

  return (
    <form onSubmit={handleSubmit} className="max-w-[46ch]">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="author_name"
            className="block text-sm font-medium text-ink-900"
          >
            Your name
          </label>
          <input
            id="author_name"
            name="author_name"
            type="text"
            required
            maxLength={60}
            className="mt-2 min-h-11 w-full border border-line bg-paper px-3 py-2 text-sm text-ink-900"
          />
        </div>

        <div>
          <label
            htmlFor="body"
            className="block text-sm font-medium text-ink-900"
          >
            Your review
          </label>
          <textarea
            id="body"
            name="body"
            required
            minLength={20}
            maxLength={1500}
            rows={5}
            className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm leading-relaxed text-ink-900"
          />
        </div>

        {/* Honeypot: off-screen for humans, filled by bots. */}
        <div
          aria-hidden
          className="absolute left-[-9999px] h-px w-px overflow-hidden"
        >
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
      </div>

      {state.status === "idle" && state.error && (
        <p role="alert" className="mt-4 text-sm text-ink-900">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-5 inline-flex min-h-11 items-center justify-center bg-ink-900 px-5 py-2.5 text-sm font-medium text-cream-50 transition-colors hover:bg-ink-700 disabled:opacity-60"
      >
        {busy ? "Publishing…" : "Publish review"}
      </button>
    </form>
  );
}