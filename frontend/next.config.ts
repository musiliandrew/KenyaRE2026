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
  async redirects() {
    return [
      {
        source: "/console/:path*",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/console",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/login",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
