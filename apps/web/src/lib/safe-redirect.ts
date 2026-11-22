// only allow same-site relative paths, never "//evil.com" or absolute URLs
export const safeNext = (next: string | null | undefined, fallback = "/") =>
  next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
