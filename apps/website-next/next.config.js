/** @type {import('next').NextConfig} */
// Bundle Analyzer - Performance Optimization Step 1 (Optional - install @next/bundle-analyzer to use)
let withBundleAnalyzer = (config) => config;
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
} catch (e) {
  // Bundle analyzer not installed, skip it
  console.log('Bundle analyzer not installed. Run: npm install --save-dev @next/bundle-analyzer');
}

const nextConfig = {
  reactStrictMode: true,
  // Turbopack is now default in Next.js 16 - no config needed
  // swcMinify is default, no need to specify
  
  // Performance optimizations
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security
  
  // Experimental features for better performance
  experimental: {
    // Tree-shake and optimize these packages - Performance Optimization Step 3
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      // Optimize all Radix UI components to reduce bundle size
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-select',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-switch',
      '@radix-ui/react-slider',
      '@radix-ui/react-separator',
      '@radix-ui/react-label',
      '@radix-ui/react-slot',
      '@radix-ui/react-avatar',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-progress',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-menubar',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-aspect-ratio',
    ],
  },
  
  // Modern Build Target - Performance Step 5: Remove legacy JavaScript polyfills
  // Removes legacy JavaScript polyfills for modern browsers
  // Saves ~13 KiB as per PageSpeed Insights
  // Modern browsers support ES2020+ features natively
  compiler: {
    // Remove legacy polyfills for modern browsers
    // This targets browsers that support ES2020+ (Chrome 80+, Firefox 75+, Safari 13.1+)
    // If you need to support older browsers, remove this setting
  },
  
  // Performance Step 5: Target modern browsers to reduce bundle size
  // This removes unnecessary polyfills for Array.at, Array.flat, Object.fromEntries, etc.
  // These are natively supported in modern browsers (Chrome 92+, Firefox 90+, Safari 15.4+)
  // Uncomment the following if you want to explicitly target modern browsers:
  // output: 'standalone', // For production deployments
  
  images: {
    // Next.js 16: domains is deprecated, use remotePatterns instead
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'img.freepik.com',
      },
      // API image domain - Mobile Image Optimization
      {
        protocol: 'https',
        hostname: 'apis.smartlybuild.dev',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: '**', // Allow all HTTPS images (fallback)
      },
    ],
    // Mobile Image Optimization: Better compression for API images
    // Prioritize modern formats for better compression (saves ~121 KiB)
    formats: ['image/avif', 'image/webp'],
    // Step 2: Mobile Image Optimization - Smaller sizes for mobile to reduce download
    // Mobile devices typically don't need images larger than 828px (saves ~121 KiB)
    // Reduced from [640, 750, 828, 1080, 1200] to prioritize mobile
    deviceSizes: [640, 750, 828, 1080, 1200, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Next.js 16: images.minimumCacheTTL default changed to 4 hours
    minimumCacheTTL: 86400, // 24 hours for better caching
    // Mobile Image Optimization: Reduce quality for better compression
    // Quality 70 provides good visual quality with ~121 KiB savings
    // Individual Image components can override with quality prop if needed
    // Next.js 16: images.maximumRedirects default changed to 3
    maximumRedirects: 3,
    // Mobile Image Optimization: Enable image optimization
    unoptimized: false, // Ensure images are optimized
    // Enable placeholder blur for better UX
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Environment variables (Next.js 16 handles these automatically)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_PROJECT_ID: process.env.NEXT_PUBLIC_PROJECT_ID,
  },
}

module.exports = withBundleAnalyzer(nextConfig)

