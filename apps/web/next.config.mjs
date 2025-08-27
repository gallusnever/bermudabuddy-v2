/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  transpilePackages: ['@bermuda/ui'],
  eslint: {
    // Allow E2E builds to proceed even if lint errors exist
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow E2E builds to proceed even if TS errors exist
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
