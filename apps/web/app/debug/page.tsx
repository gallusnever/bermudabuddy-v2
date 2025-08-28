'use client';

export default function DebugPage() {
  // Check what env vars are actually available at runtime
  const config = {
    apiBase: process.env.NEXT_PUBLIC_API_BASE,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', background: '#000', color: '#0f0', minHeight: '100vh' }}>
      <h1>🔍 Environment Debug Page</h1>
      <hr />
      
      <h2>Environment Variables Status:</h2>
      <pre style={{ background: '#111', padding: '20px', borderRadius: '8px' }}>
{`NEXT_PUBLIC_API_BASE: ${config.apiBase ? '✅ SET' : '❌ MISSING'}
  Value: ${config.apiBase || 'undefined'}

NEXT_PUBLIC_SUPABASE_URL: ${config.supabaseUrl ? '✅ SET' : '❌ MISSING'}
  Value: ${config.supabaseUrl || 'undefined'}

NEXT_PUBLIC_SUPABASE_ANON_KEY: ${config.supabaseKey ? '✅ SET' : '❌ MISSING'}
  Value: ${config.supabaseKey ? config.supabaseKey.substring(0, 20) + '...' : 'undefined'}

NEXT_PUBLIC_MAPBOX_TOKEN: ${config.mapboxToken ? '✅ SET' : '❌ MISSING'}
  Value: ${config.mapboxToken ? config.mapboxToken.substring(0, 20) + '...' : 'undefined'}`}
      </pre>

      <h2>Test API Connection:</h2>
      <button 
        onClick={async () => {
          const apiBase = config.apiBase || 'http://localhost:8000';
          try {
            const res = await fetch(`${apiBase}/healthz`);
            const data = await res.json();
            alert(`API Response: ${JSON.stringify(data, null, 2)}`);
          } catch (err: any) {
            alert(`API Error: ${err.message}`);
          }
        }}
        style={{ 
          background: '#0f0', 
          color: '#000', 
          padding: '10px 20px', 
          fontSize: '16px',
          cursor: 'pointer',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        Test API Health Check
      </button>

      <h2>Test Mapbox:</h2>
      <div id="test-map" style={{ width: '100%', height: '400px', background: '#333', marginTop: '20px' }}>
        {config.mapboxToken ? (
          <div>Token is set. If map doesn't load, check browser console for errors.</div>
        ) : (
          <div style={{ color: 'red', padding: '20px' }}>
            ❌ MAPBOX TOKEN IS NOT SET IN BUILD!<br/>
            The environment variable NEXT_PUBLIC_MAPBOX_TOKEN was not available when this app was built.
          </div>
        )}
      </div>

      <h2>Instructions if variables are missing:</h2>
      <ol style={{ lineHeight: '1.8' }}>
        <li>Go to Render Dashboard → Your Web Service → Settings → Environment</li>
        <li>Add ALL the NEXT_PUBLIC_* variables listed above</li>
        <li>Click "Clear build cache & deploy" to force a fresh build</li>
        <li>Check the build logs for "BUILD TIME ENV VAR CHECK" to verify they're set</li>
      </ol>
    </div>
  );
}