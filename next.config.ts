import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingExcludes: {
    "/_not-found": ["**/*"],
  },
  devIndicators: false,
};

export default nextConfig;
