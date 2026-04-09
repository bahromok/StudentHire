import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Vercel-specific configuration
  images: {
    unoptimized: process.env.VERCEL === '1',
  },
};

export default nextConfig;
