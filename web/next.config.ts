import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Per-user, signed-in pages are rendered on request, so Cache Components stays off.
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
