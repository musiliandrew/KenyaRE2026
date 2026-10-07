import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN:
      process.env.MAPBOX_TOKEN ||
      process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
      "",
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
