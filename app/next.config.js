const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE,
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Keep existing outputFileTracingRoot and add serverActions limit to help prevent Vercel prerendering issues
    outputFileTracingRoot: path.join(__dirname, '../'),
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  // Exclude API routes from static optimization (helps prevent Vercel from trying to prerender them)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
      {
        source: '/api/auth/api-keys/:id*',
        destination: '/api/auth/api-keys/:id*',
      },
    ];
  },
  // Add headers to prevent caching of API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
    ];
  },
  // Prevent lint errors from failing the build on Vercel
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Allow the build to succeed even if TypeScript errors exist (per request)
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
