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
          console.log('Testing API at:', apiBase);
          try {
            const res = await fetch(`${apiBase}/healthz`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              mode: 'cors',
            });
            
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            
            const data = await res.json();
            alert(`✅ API Response: ${JSON.stringify(data, null, 2)}`);
          } catch (err: any) {
            console.error('API Test Error:', err);
            alert(`❌ API Error: ${err.message}\n\nCheck browser console for details.\n\nThis is likely a CORS issue if you see "Load failed"`);
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
      <button
        onClick={() => {
          const token = config.mapboxToken;
          if (!token) {
            alert('No Mapbox token available!');
            return;
          }
          
          // Test if we can reach Mapbox API
          fetch(`https://api.mapbox.com/styles/v1/mapbox/streets-v11?access_token=${token}`)
            .then(res => {
              if (res.ok) {
                alert('✅ Mapbox API is accessible! Token is valid.');
              } else {
                alert(`❌ Mapbox API error: ${res.status} ${res.statusText}`);
              }
            })
            .catch(err => {
              alert(`❌ Cannot reach Mapbox: ${err.message}`);
            });
        }}
        style={{ 
          background: '#00f', 
          color: '#fff', 
          padding: '10px 20px', 
          fontSize: '16px',
          cursor: 'pointer',
          border: 'none',
          borderRadius: '4px',
          marginBottom: '20px'
        }}
      >
        Test Mapbox Token
      </button>
      
      <div id="test-map" style={{ width: '100%', height: '400px', background: '#333', marginTop: '20px' }}>
        {config.mapboxToken ? (
          <div style={{ padding: '20px', color: '#0f0' }}>
            Token is set: {config.mapboxToken.substring(0, 30)}...<br/><br/>
            Click "Test Mapbox Token" above to verify it works.<br/><br/>
            If token test passes but map is grey, it's a initialization issue.
          </div>
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