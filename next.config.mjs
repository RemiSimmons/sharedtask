import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production-ready configuration
  eslint: {
    // Only ignore during builds in development
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  typescript: {
    // Only ignore build errors in development
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  images: {
    // Enable image optimization for better performance
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ['app.sharedtask.ai', 'sharedtask.ai', 'www.sharedtask.ai'], // Add your domains
  },
  // Enable compression for better performance
  compress: true,
  // Production optimizations
  experimental: {
    // Disable optimizePackageImports temporarily to avoid SSR issues
    // optimizePackageImports: [],
  },
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }
    
    // Simplified webpack optimization - avoid conflicts in development
    // Disabled splitChunks temporarily to avoid SSR issues
    // if (process.env.NODE_ENV === 'production') {
    //   config.optimization = {
    //     ...config.optimization,
    //     splitChunks: {
    //       chunks: 'all',
    //       cacheGroups: {
    //         vendor: {
    //           test: /[\\/]node_modules[\\/]/,
    //           name: 'vendors',
    //           chunks: 'all',
    //         },
    //       },
    //     },
    //   }
    // }
    
    return config
  },
  // Performance and security optimizations
  poweredByHeader: false, // Remove X-Powered-By header for security
  reactStrictMode: true, // Better development experience and performance
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default withBundleAnalyzer(nextConfig)
