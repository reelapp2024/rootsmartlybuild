// next.config.js - Next.js Configuration
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization
  images: {
    domains: [
      'images.unsplash.com',
      'via.placeholder.com',
      // Add your API domain here
      process.env.NEXT_PUBLIC_API_URL?.replace('http://', '').replace('https://', '') || 'localhost:3000'
    ],
    unoptimized: false, // Set to true if you don't want Next.js image optimization
  },
  
  // Environment variables (already available via process.env.NEXT_PUBLIC_*)
  env: {
    // These are already available, but you can add custom ones here
  },
  
  // Experimental features
  experimental: {
    serverActions: true, // Enable server actions if needed
  },
  
  // Webpack configuration (if needed)
  webpack: (config, { isServer }) => {
    // Add custom webpack config if needed
    return config
  },
  
  // Output configuration
  output: 'standalone', // For Docker deployments
  // OR
  // output: 'export', // For static export (no SSR)
}

module.exports = nextConfig


