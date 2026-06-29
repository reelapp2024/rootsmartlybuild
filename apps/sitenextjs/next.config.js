const path = require('path');

const isStaticExport = process.env.NEXT_DEPLOY_TARGET === 'static';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@geniebuild', '@schema/core', 'motion'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  ...(isStaticExport
    ? {
        output: 'export',
        trailingSlash: false,
        images: { unoptimized: true },
      }
    : {}),
  experimental: {},
  turbopack: {
    resolveAlias: {
      '@ui/blocks': path.resolve(__dirname, '../geniebuild/src/ui-blocks/index.tsx'),
      '@geniebuild': path.resolve(__dirname, '../geniebuild'),
      '@schema/core': path.resolve(__dirname, '../../packages/schema/src'),
      '@shared/siteSectionOrder': path.resolve(
        __dirname,
        '../../backend/additional/siteSectionOrder.mjs'
      ),
      'motion/react': path.resolve(__dirname, '../geniebuild/motionStub.tsx'),
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@ui/blocks': path.resolve(__dirname, '../geniebuild/src/ui-blocks/index.tsx'),
      '@geniebuild': path.resolve(__dirname, '../geniebuild'),
      '@schema/core': path.resolve(__dirname, '../../packages/schema/src'),
      '@shared/siteSectionOrder': path.resolve(
        __dirname,
        '../../backend/additional/siteSectionOrder.mjs'
      ),
      'motion/react': path.resolve(__dirname, '../geniebuild/motionStub.tsx'),
    };
    return config;
  },
};

module.exports = nextConfig;
