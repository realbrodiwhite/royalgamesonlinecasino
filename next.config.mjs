/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: false,
  },
  // Optimize build
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  async rewrites() {
    return [
      {
        source: '/data/:path*',
        destination: 'http://localhost:3001/data/:path*',
      },
      {
        source: '/gamescripts/:path*',
        destination: 'http://localhost:3001/gamescripts/:path*',
      },
    ];
  },
  // Configure both Webpack and Turbopack
  webpack: (config) => {
    config.externals = [...config.externals, { canvas: 'canvas' }];
    return config;
  },
  experimental: {
    turbo: {
      rules: {
        // Add Turbopack configuration
        externals: ['canvas']
      }
    }
  }
};

export default nextConfig;
