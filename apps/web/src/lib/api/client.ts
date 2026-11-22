// Browser-side API client. Calls go to /api/v2 on this origin and are
// forwarded to Express by the rewrite in next.config.ts, so the auth cookies
// are first-party and sent automatically.
import type { ApiEnvelope } from "./types";

const BASE = "/api/v2";

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errors: string[] = [],
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

// one refresh at a time, shared by every request that hit a 401
let refreshing: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${BASE}/user/refresh-token`, { method: "POST" })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

const NO_REFRESH = ["/user/login", "/user/register", "/user/refresh-token"];

async function parse<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok) {
    throw new ApiClientError(
      body?.message || `Request failed (${res.status})`,
      res.status,
      body?.errors ?? [],
    );
  }
  return body?.data as T;
}

type JsonInit = Omit<RequestInit, "body"> & { json?: unknown; body?: BodyInit };

/** Fetch `/api/v2${path}` and return the envelope's `data`. Retries once after refreshing an expired session. */
export async function api<T>(path: string, init: JsonInit = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const request = () =>
    fetch(`${BASE}${path}`, {
      ...rest,
      headers: {
        ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });

  let res = await request();
  if (res.status === 401 && !NO_REFRESH.includes(path)) {
    if (await refreshSession()) res = await request();
  }
  return parse<T>(res);
}

/** Multipart upload with progress (fetch can't report upload progress). */
export function uploadWithProgress<T>(
  path: string,
  form: FormData,
  onProgress: (fraction: number) => void,
  method: "POST" | "PATCH" = "POST",
): { promise: Promise<T>; abort: () => void } {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<T>((resolve, reject) => {
    const send = (retried: boolean) => {
      xhr.open(method, `${BASE}${path}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total);
      };
      xhr.onload = async () => {
        if (xhr.status === 401 && !retried && (await refreshSession())) {
          send(true);
          return;
        }
        let body: ApiEnvelope<T> | null = null;
        try {
          body = JSON.parse(xhr.responseText);
        } catch {
          /* non-JSON error page */
        }
        if (xhr.status >= 200 && xhr.status < 300) resolve(body?.data as T);
        else
          reject(
            new ApiClientError(
              body?.message || `Upload failed (${xhr.status})`,
              xhr.status,
            ),
          );
      };
      xhr.onerror = () => reject(new ApiClientError("Network error", 0));
      xhr.onabort = () => reject(new ApiClientError("Upload cancelled", 0));
      xhr.send(form);
    };
    send(false);
  });
  return { promise, abort: () => xhr.abort() };
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";
