import { NextResponse, type NextRequest } from "next/server";

// Pages that need a session. The check is only for a cookie's presence;
// the API still verifies the token on every request.
export function proxy(request: NextRequest) {
  const hasSession =
    request.cookies.has("accessToken") || request.cookies.has("refreshToken");

  if (!hasSession) {
    const login = new URL("/login", request.url);
    login.searchParams.set(
      "next",
      request.nextUrl.pathname + request.nextUrl.search,
    );
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

// Never match /api: proxied requests would be buffered and size-limited,
// which breaks video uploads.
export const config = {
  matcher: [
    "/upload",
    "/studio/:path*",
    "/feed",
    "/history",
    "/liked",
    "/playlists/:path*",
    "/settings",
  ],
};
