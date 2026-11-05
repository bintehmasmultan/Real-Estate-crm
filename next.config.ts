import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev server binds 0.0.0.0, so browsers that open it as 127.0.0.1
  // are treated as cross-origin. Without this, the HMR socket is rejected
  // and the dev client never hydrates.
  allowedDevOrigins: ["127.0.0.1"],
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
