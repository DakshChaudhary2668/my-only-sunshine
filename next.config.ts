import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
