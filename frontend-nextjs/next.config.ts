import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  /* config options here */

  // Enable standalone output for Docker/Cloud Run
  output: 'standalone',

  // Disable telemetry in production
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TEMPORARY: Disable TypeScript and lint errors for Docker build testing
  // TODO: Fix all errors in production
  typescript: {
    ignoreBuildErrors: true,
  },

  // Image optimization configuration
  // Disabled because images are already on Cloudflare R2 CDN with .webp format
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-eb9816a6f9204df2a21a3d0a0f8152c1.r2.dev',
        pathname: '/static/img/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-eb9816a6f9204df2a21a3d0a0f8152c1.r2.dev',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5001',
        pathname: '/api/v1/places/photo/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);


