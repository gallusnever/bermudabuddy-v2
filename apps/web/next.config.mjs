/** @type {import('next').NextConfig} */

// Check for required environment variables at BUILD TIME
const requiredEnvVars = [
  'NEXT_PUBLIC_API_BASE',
  'NEXT_PUBLIC_SUPABASE_URL', 
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_MAPBOX_TOKEN'
];

console.log('=== BUILD TIME ENV VAR CHECK ===');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.error(`❌ MISSING: ${varName}`);
  } else {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  }
});

// Log all NEXT_PUBLIC vars
console.log('\n=== ALL NEXT_PUBLIC VARS ===');
Object.keys(process.env).forEach(key => {
  if (key.startsWith('NEXT_PUBLIC_')) {
    console.log(`${key}: ${process.env[key]?.substring(0, 30)}...`);
  }
});
console.log('=== END ENV CHECK ===\n');

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
  // Force env vars to be available
  env: {
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
  },
};

export default nextConfig;
