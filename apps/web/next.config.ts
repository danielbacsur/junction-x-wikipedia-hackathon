import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
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
