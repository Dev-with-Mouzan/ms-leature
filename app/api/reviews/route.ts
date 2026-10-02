import { NextResponse } from "next/server";

import { books } from "@/lib/books";
import { createReview } from "@/lib/reviews";
import { validateReview } from "@/lib/validate-review";

export const runtime = "nodejs";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const MAX_TRACKED_IPS = 5000;

// ponytail: in-memory rate limit is per-instance and resets on redeploy. Move it
// to a shared store only if you ever run more than one server instance.
const hits = new Map<string, number[]>();

function overLimit(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  if (hits.size > MAX_TRACKED_IPS) hits.clear();
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (overLimit(ip)) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = validateReview(payload, books.map((book) => book.slug));
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  try {
    await createReview(result.value);
  } catch (error) {
    console.error("[reviews] insert failed", error);
    return NextResponse.json(
      { error: "Reviews are not available right now. Please try again later." },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}