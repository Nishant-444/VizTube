// Server-side API client for Server Components. Calls Express directly and
// forwards the visitor's cookies, so responses are personalized the same way
// they are in the browser. Do not import from Client Components.
import { cookies } from "next/headers";
import type { ApiEnvelope, User } from "./types";

const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://localhost:3000";

export class ServerApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function cookieHeader() {
  const store = await cookies();
  return store
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join("; ");
}

/** GET `/api/v2${path}` and return `data`, or null on 404. */
export async function serverApi<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_INTERNAL_URL}/api/v2${path}`, {
    headers: { Cookie: await cookieHeader() },
    cache: "no-store",
  });
  if (res.status === 404) return null;

  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok) {
    throw new ServerApiError(body?.message || `API error ${res.status}`, res.status);
  }
  return body?.data ?? null;
}

/** The logged-in user, or null (no session, or the access token expired). */
export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  if (!store.has("accessToken")) return null;
  try {
    return await serverApi<User>("/user/current-user-details");
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 401) return null;
    throw error;
  }
}

/** True when a refresh token cookie exists, i.e. the session may be renewable. */
export async function hasRefreshToken() {
  return (await cookies()).has("refreshToken");
}
