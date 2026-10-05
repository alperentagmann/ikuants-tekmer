import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The parent folder has its own package-lock.json; pin the workspace root to this project.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
