import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    browserToTerminal: "error",
  },
  experimental: {
    turbopackFileSystemCacheForBuild: true,
  },
};

export default nextConfig;
