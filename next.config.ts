import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle for small production/Docker images.
  output: "standalone",
};

export default nextConfig;
