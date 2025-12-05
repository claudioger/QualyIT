import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@qualyit/api', '@qualyit/database', '@qualyit/shared'],
  // Reduce memory usage during build
  swcMinify: true,
  compress: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Reduce parallel compilation to save memory
    webpackBuildWorker: false,
  },
  // Disable source maps in production build to save memory
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
