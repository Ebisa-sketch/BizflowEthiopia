import type { NextConfig } from "next";

const nextConfig = (phase: string): NextConfig => {
  return {
    reactStrictMode: true,
    poweredByHeader: false,
    outputFileTracingExcludes: {
      "/_not-found": ["**/*"],
    },
    devIndicators: false,
    env: {
      NEXT_PHASE: phase,
    },
  };
};

export default nextConfig;
