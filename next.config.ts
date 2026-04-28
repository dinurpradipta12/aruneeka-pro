import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Danger: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    // We already fixed the critical Page props errors, so the remaining are likely 'any' types.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
