import type { NextConfig } from "next";

// Express API; the browser never calls it directly (see rewrites below)
const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  // Cache Components is off: every page here depends on who is logged in, so
  // static shells buy little and would require <Suspense> around every
  // cookie read.
  cacheComponents: false,

  // hide the dev-only "N" badge: it covered the sidebar toggle and the top-bar
  // buttons. Build/runtime error overlays still appear.
  devIndicators: false,

  experimental: {
    // video uploads stream through the rewrite below and can take minutes
    proxyTimeout: 10 * 60 * 1000,
  },

  // Tailwind v4 runs through Turbopack (no PostCSS config)
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "http", hostname: "res.cloudinary.com" },
    ],
  },

  // Same-origin API: the browser calls /api/v2/* on this app and Next forwards
  // it to Express, so the API's sameSite=strict httpOnly cookies just work and
  // no CORS is needed. In production Nginx does the same routing.
  async rewrites() {
    return [
      {
        source: "/api/v2/:path*",
        destination: `${API_INTERNAL_URL}/api/v2/:path*`,
      },
    ];
  },
};

export default nextConfig;
