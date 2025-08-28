'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function TestPage() {
  const [results, setResults] = useState<any>({});
  
  useEffect(() => {
    runTests();
  }, []);
  
  async function runTests() {
    const testResults: any = {};
    
    // 1. Test Supabase connection
    try {
      const { data: { user } } = await supabase.auth.getUser();
      testResults.supabaseAuth = user ? `✅ Logged in as ${user.email}` : '❌ Not logged in';
      
      if (user) {
        // Try to fetch profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          testResults.supabaseProfile = `❌ Profile error: ${error.message}`;
        } else if (profile) {
          testResults.supabaseProfile = `✅ Profile found: ${profile.nickname || 'NO NICKNAME'}`;
          testResults.profileData = {
            nickname: profile.nickname,
            city: profile.city,
            state: profile.state,
            lat: profile.lat,
            lon: profile.lon,
          };
        } else {
          testResults.supabaseProfile = '❌ No profile found';
        }
      }
    } catch (err: any) {
      testResults.supabaseAuth = `❌ Auth error: ${err.message}`;
    }
    
    // 2. Test API connection
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
      const res = await fetch(`${apiBase}/healthz`);
      const data = await res.json();
      testResults.api = `✅ API connected: ${data.status}`;
    } catch (err: any) {
      testResults.api = `❌ API error: ${err.message}`;
    }
    
    // 3. Test Mapbox directly
    const mapToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    testResults.mapboxToken = mapToken ? `✅ Token exists: ${mapToken.substring(0, 20)}...` : '❌ No token';
    
    setResults(testResults);
  }
  
  function testMapbox() {
    const container = document.getElementById('test-map-container');
    if (!container) {
      alert('Container not found');
      return;
    }
    
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      alert('No Mapbox token!');
      return;
    }
    
    try {
      mapboxgl.accessToken = token;
      const map = new mapboxgl.Map({
        container: 'test-map-container',
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: [-95.7909, 36.0526], // Broken Arrow
        zoom: 12,
      });
      
      map.on('load', () => {
        alert('✅ Map loaded successfully!');
      });
      
      map.on('error', (e) => {
        alert(`❌ Map error: ${JSON.stringify(e)}`);
        console.error('Map error:', e);
      });
    } catch (err: any) {
      alert(`❌ Failed to create map: ${err.message}`);
      console.error('Map creation error:', err);
    }
  }
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', minHeight: '100vh', background: '#000', color: '#0f0' }}>
      <h1>🔬 Real Tests</h1>
      <hr />
      
      <h2>Test Results:</h2>
      <pre style={{ background: '#111', padding: '20px', borderRadius: '8px' }}>
        {JSON.stringify(results, null, 2)}
      </pre>
      
      <h2>Mapbox Test:</h2>
      <button 
        onClick={testMapbox}
        style={{ 
          background: 'red', 
          color: 'white', 
          padding: '10px 20px', 
          fontSize: '20px',
          marginBottom: '20px',
          cursor: 'pointer'
        }}
      >
        TEST MAPBOX NOW
      </button>
      
      <div id="test-map-container" style={{ width: '100%', height: '400px', background: 'grey' }}></div>
      
      <h2>LocalStorage Check:</h2>
      <button onClick={() => {
        const data = {
          onboarding: localStorage.getItem('bb_onboarding'),
          onboardingComplete: localStorage.getItem('bb_onboarding_complete'),
          propertyId: localStorage.getItem('bb_property_id'),
        };
        alert(JSON.stringify(data, null, 2));
      }}>Check LocalStorage</button>
      
      <h2>Cookies Check:</h2>
      <button onClick={() => {
        alert(document.cookie);
      }}>Check Cookies</button>
    </div>
  );
}