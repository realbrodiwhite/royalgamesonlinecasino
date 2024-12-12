/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  // Optimize build
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
};

export default nextConfig;