import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AGENTS.md is read at runtime by /llms.txt — make sure Vercel's file
  // tracing bundles it with that route.
  outputFileTracingIncludes: {
    "/llms.txt": ["./AGENTS.md"],
  },
};

export default nextConfig;
