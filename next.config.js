/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Turbopack is now default in Next.js 16 - no config needed
  // swcMinify is default, no need to specify
  
  // Performance optimizations
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
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
      // Add your API image domain here
      {
        protocol: 'https',
        hostname: '**', // Allow all HTTPS images (adjust based on your API)
      },
    ],
    // Optimize image loading
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Next.js 16: images.minimumCacheTTL default changed to 4 hours
    minimumCacheTTL: 86400, // 24 hours for better caching
    // Next.js 16: images.qualities default changed to [75]
    qualities: [75, 90], // Multiple qualities for responsive images
    // Next.js 16: images.maximumRedirects default changed to 3
    maximumRedirects: 3,
    // Enable placeholder blur for better UX
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Environment variables (Next.js 16 handles these automatically)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_PROJECT_ID: process.env.NEXT_PUBLIC_PROJECT_ID,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },
}

module.exports = nextConfig

