import "server-only";

import { cookies } from "next/headers";

/** URL of the FastAPI backend, read from env so Vercel and local match. */
const BASE = (process.env.FASTAPI_URL ?? "http://localhost:8000").replace(/\/$/, "");
const ADMIN_COOKIE = "admin_token";

async function cookieStore() {
  return await cookies();
}

/**
 * Store the bearer token issued by FastAPI. The cookie is httpOnly so only the
 * Next.js server (not browser JS) can read it, which is enough: admin requests
 * go Next -> FastAPI over the server, so no CORS surface.
 */
export async function setAdminToken(token: string) {
  const c = await cookieStore();
  c.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminToken() {
  const c = await cookieStore();
  c.delete(ADMIN_COOKIE);
}

export async function getAdminToken(): Promise<string | undefined> {
  const c = await cookieStore();
  return c.get(ADMIN_COOKIE)?.value;
}

/** Call the FastAPI admin endpoints with the current admin token. */
export async function adminFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getAdminToken();
  if (!token) {
    // Let the caller translate this to a login redirect.
    throw new Error("Not signed in");
  }
  const res = await fetch(`${BASE}/admin${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
    // Server actions are dynamic; no caching of mutations.
    cache: "no-store",
  });
  if (res.status === 401) {
    await clearAdminToken();
    throw new Error("Session expired");
  }
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.detail ?? "Request failed");
  }
  // Some DELETE routes return empty JSON bodies.
  if (res.status === 204) return {} as T;
  return (await res.json()) as T;
}