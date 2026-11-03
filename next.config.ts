import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin is CommonJS and is loaded with require() on Vercel.
  // Keep it external (also a Next.js default) so Node resolves the
  // jwks-rsa → jose override in package.json instead of bundling jose's
  // ESM-only webapi build, which throws ERR_REQUIRE_ESM.
  serverExternalPackages: ["firebase-admin"],
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
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
