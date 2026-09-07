import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page is generated from the .htm files in ./output at build time.
  images: { unoptimized: true },
};

export default nextConfig;
