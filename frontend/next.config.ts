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
  async rewrites() {
    const backendUrl = (
      process.env.BACKEND_API_URL ||
      process.env.API_URL ||
      "http://127.0.0.1:8000"
    ).replace(/\/$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
