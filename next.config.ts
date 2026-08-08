import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useTypeScriptCli: true, // TS7 nativo (Go) en el typecheck del build — ver skill ai-update-harness
  },
  logging: {
    browserToTerminal: "error",
  },
};

export default nextConfig;
