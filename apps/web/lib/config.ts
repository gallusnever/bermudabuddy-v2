// Client-side configuration
// Next.js requires NEXT_PUBLIC_ vars at build time

export const config = {
  // API Base URL - MUST be set in Render environment variables
  apiBase: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000',
  
  // Supabase - MUST be set in Render environment variables  
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  
  // Mapbox - MUST be set in Render environment variables
  mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
  
  // E2E bypass - should NOT be set in production
  e2eBypass: process.env.NEXT_PUBLIC_E2E_AUTH_BYPASS === '1',
};

// Debug: Log configuration on load (remove in production)
if (typeof window !== 'undefined') {
  console.log('[Config] Runtime configuration:', {
    apiBase: config.apiBase,
    supabaseUrl: config.supabaseUrl ? 'SET' : 'MISSING',
    supabaseAnonKey: config.supabaseAnonKey ? 'SET' : 'MISSING',
    mapboxToken: config.mapboxToken ? 'SET' : 'MISSING',
    e2eBypass: config.e2eBypass
  });
  
  // Warning if critical vars are missing
  if (!config.apiBase || config.apiBase === 'http://localhost:8000') {
    console.error('[Config] WARNING: API base URL not configured properly!');
  }
  if (!config.supabaseUrl) {
    console.error('[Config] WARNING: Supabase URL not configured!');
  }
  if (!config.mapboxToken) {
    console.error('[Config] WARNING: Mapbox token not configured!');
  }
}

export default config;