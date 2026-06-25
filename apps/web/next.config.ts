import type { NextConfig } from "next";

const apiTarget = process.env.API_TARGET || process.env.NEXT_PUBLIC_API_TARGET || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiTarget.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
