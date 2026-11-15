import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,

  // The demo is shown from the development server, without Next's badge.
  devIndicators: false,
  partialPrefetching: true,
  poweredByHeader: false,
  reactCompiler: true,

  // The shared packages are plain TypeScript, compiled here with the app.
  transpilePackages: [
    "@wtt/package-db",
    "@wtt/package-engine",
    "@wtt/package-models",
    "@wtt/package-wikitext",
  ],

  serverExternalPackages: ["mariadb"],

  // The historian agent is its own server. In development the browser
  // reaches it through the web app, so there is one origin and no CORS.
  async rewrites() {
    if (process.env.BACKEND_URL) return { beforeFiles: [
      { source: "/api/:path*", destination: "/backend/api/:path*" },
      { source: "/eve/:path*", destination: "/backend/eve/:path*" },
      { source: "/mcp", destination: "/backend/mcp" },
    ] };
    return [{ source: "/eve/historian/v1/:path*", destination: `${process.env.HISTORIAN_URL ?? "http://localhost:3001"}/eve/v1/:path*` }];
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
