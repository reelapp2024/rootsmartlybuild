const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ui/blocks', '@geniebuild'],
  experimental: {
    optimizePackageImports: ['@ui/blocks'],
  },
  // Turbopack configuration for Next.js 16
  turbopack: {
    resolveAlias: {
      '@ui/utils': path.resolve(__dirname, '../../packages/ui/src/utils'),
      '@geniebuild': path.resolve(__dirname, '../geniebuild'),
    },
  },
  // Keep webpack config for fallback (if using --webpack flag)
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@ui/utils': path.resolve(__dirname, '../../packages/ui/src/utils'),
      '@geniebuild': path.resolve(__dirname, '../geniebuild'),
    };
    return config;
  },
}

module.exports = nextConfig
