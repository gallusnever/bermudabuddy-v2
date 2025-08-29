"use client";
import { useState, useEffect } from 'react';
import { apiUrl } from '../../lib/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Drawer, Chip, Badge, Icons, Tooltip } from '@bermuda/ui';
import BudSays, { getRandomTip } from '../../components/bud-says';
import { useAuth } from '../../contexts/auth-context';

type HourRow = {
  ts: string;
  wind_mph?: number;
  wind_gust_mph?: number;
  precip_prob?: number;
  precip_in?: number;
  status: 'OK' | 'CAUTION' | 'NOT_OK';
  rules: Record<string, boolean>;
  provider: string;
};

export default function OkToSprayPage() {
  const { profile } = useAuth();
  const [searchParams, setSearchParamsState] = useState<URLSearchParams | null>(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<HourRow[]>([]);
  const [source, setSource] = useState<{ provider: string; station?: any } | null>(null);
  const [property, setProperty] = useState<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAutoOpen, setPendingAutoOpen] = useState(false);

  // Helper to check if timestamp is current hour
  const isCurrentHour = (ts: string) => {
    const t = new Date(ts);
    const n = new Date();
    return t.getFullYear() === n.getFullYear() && t.getMonth() === n.getMonth() &&
           t.getDate() === n.getDate() && t.getHours() === n.getHours();
  };

  function resolveCoords() {
    // strict priority: profile.lat/lon → profile.latitude/longitude → property.lat/lon
    if (profile?.lat != null && profile?.lon != null) return { lat: profile.lat, lon: profile.lon };
    if (profile?.latitude != null && profile?.longitude != null) return { lat: profile.latitude, lon: profile.longitude };
    if (property?.lat != null && property?.lon != null) return { lat: property.lat, lon: property.lon };
    return null;
  }

  // on mount, note we should auto-open
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setSearchParamsState(params);
    if (params.get('open') === '1') setPendingAutoOpen(true);
    
    // Load property data if available
    const propertyId = localStorage.getItem('bb_property_id');
    if (propertyId) {
      fetch(apiUrl(`/api/properties/${propertyId}`))
        .then(res => res.json())
        .then(data => setProperty(data))
        .catch(() => {});
    }
  }, []);

  // when coords are finally available, auto-fetch once
  useEffect(() => {
    if (!pendingAutoOpen) return;
    const c = resolveCoords();
    if (c) {
      fetchTable(c.lat, c.lon);
      setPendingAutoOpen(false);
    }
  }, [pendingAutoOpen, profile?.lat, profile?.lon, profile?.latitude, profile?.longitude, property?.lat, property?.lon]);

  // Get display location for the button
  function getDisplayLocation() {
    if (profile?.city && profile?.state) {
      return `${profile.city}, ${profile.state}`;
    }
    if (property?.city && property?.state) {
      return `${property.city}, ${property.state}`;
    }
    const lat = profile?.lat ?? profile?.latitude ?? property?.lat;
    const lon = profile?.lon ?? profile?.longitude ?? property?.lon;
    if (lat && lon) {
      return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
    }
    return null;
  }

  async function fetchTable(latOverride?: number, lonOverride?: number) {
    setIsLoading(true);
    setFetchError(null);
    
    try {
      const coords = latOverride != null && lonOverride != null ? { lat: latOverride, lon: lonOverride } : (resolveCoords() ?? { lat: 36.0526, lon: -95.7909 });
      console.log('[OK-to-Spray] Fetching with coords:', coords, 'Source:', latOverride != null ? 'override' : resolveCoords() ? 'resolved' : 'fallback');
      
      const res = await fetch(apiUrl(`/api/weather/ok-to-spray?lat=${coords.lat}&lon=${coords.lon}&hours=12`));
      if (!res.ok) {
        throw new Error(`Weather service error: ${res.status}`);
      }
      
      const data = await res.json();
      if (!data.table || !Array.isArray(data.table)) {
        throw new Error('Invalid response from weather service');
      }
      
      // Anchor to now - only show current and future hours
      const nowMs = Date.now();
      const next12 = Array.isArray(data.table)
        ? data.table
            .filter((r:any) => Number(new Date(r.ts)) >= nowMs)
            .slice(0, 12)
        : [];
      setRows(next12);
      setSource(data.source);
      setOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch spray window data';
      setFetchError(message);
      console.error('Error fetching spray window:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="container mx-auto max-w-4xl px-6 py-8">
      {/* Bud's Spray Wisdom */}
      <div className="mb-6">
        <BudSays category="spray" />
      </div>
      
      <Card className="bb-clay">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.Wind /> OK‑to‑Spray
            <Tooltip text="Bud says: These rules ain't suggestions - they're the difference between effective treatment and wasting money.">
              <span className="cursor-help text-xs bb-card px-1.5 py-0.5 rounded">?</span>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted mb-4">
            <Tooltip text="Bud says: 3mph minimum keeps droplets from floating, 10mph max keeps 'em from drifting to your neighbor's petunias.">
              <span className="cursor-help">Hourly rules: wind 3–10 mph; gust &lt; 15 mph; no rain in next hour and &lt; 20% probability.</span>
            </Tooltip>
          </p>
          
          {fetchError && (
            <div className="mb-4 p-3 bg-red-900/20 border-l-4 border-red-600 rounded">
              <div className="flex items-center gap-2">
                <Icons.AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">{fetchError}</span>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <div>
              <Button 
                className="w-full sm:w-auto" 
                onClick={() => fetchTable()}
                disabled={isLoading}
              >
                {isLoading ? 'Fetching…' : 'Fetch spray window'}
              </Button>
              {getDisplayLocation() && (
                <div className="text-xs text-muted mt-1">
                  Location: {getDisplayLocation()}
                </div>
              )}
            </div>
            {source && (
              <Chip>
                Provider: {source.provider}
              </Chip>
            )}
          </div>
        </CardContent>
      </Card>

      <Drawer open={open} onClose={() => setOpen(false)} title="Spray Window Analysis">
        {source && (
          <div className="mb-4 p-3 bb-card border-l-4 border-blue-700/50">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wide text-blue-400">Weather Source</div>
              <Badge className="bg-blue-800/30 border-blue-700/50">{source.provider}</Badge>
            </div>
            {source.station && (
              <div className="text-xs text-muted mt-1">Station: {source.station.name}</div>
            )}
          </div>
        )}
        
        <div className="space-y-2">
          {rows.map((r, idx) => {
            const time = new Date(r.ts);
            const hour = time.getHours();
            const isNight = hour < 6 || hour >= 20;
            const isMorning = hour >= 6 && hour < 12;
            const isAfternoon = hour >= 12 && hour < 17;
            const isEvening = hour >= 17 && hour < 20;
            
            let timeIcon = '🌙'; // moon
            if (isMorning) timeIcon = '🌅'; // sunrise
            if (isAfternoon) timeIcon = '☀️'; // sun
            if (isEvening) timeIcon = '🌇'; // sunset
            
            const failedRules = Object.entries(r.rules).filter(([_, v]) => !v).map(([k]) => k);
            
            return (
              <div key={r.ts} className={`
                bb-card p-4 transition-all hover:shadow-lg
                ${r.status === 'OK' ? 'border-l-4 border-emerald-600' : ''}
                ${r.status === 'CAUTION' ? 'border-l-4 border-amber-600' : ''}
                ${r.status === 'NOT_OK' ? 'border-l-4 border-red-600 opacity-75' : ''}
                ${isCurrentHour(r.ts) ? 'bg-emerald-600/5 ring-1 ring-emerald-600/20' : ''}
              `}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{timeIcon}</div>
                    <div>
                      <div className="text-lg font-bold">
                        {new Date(r.ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                      <Badge className={`
                        ${r.status === 'OK' ? 'bg-emerald-700/30 border-emerald-600/50' : ''}
                        ${r.status === 'CAUTION' ? 'bg-amber-700/30 border-amber-600/50' : ''}
                        ${r.status === 'NOT_OK' ? 'bg-red-700/30 border-red-600/50' : ''}
                      `}>
                        {r.status === 'OK' ? '✅ Good to spray' : r.status === 'CAUTION' ? '⚠️ Use caution' : '❌ Do not spray'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div className="text-center p-2 bb-card rounded">
                    <div className="text-xs text-muted uppercase">Wind</div>
                    <div className="text-lg font-bold">{r.wind_mph ?? '—'}</div>
                    <div className="text-xs text-muted">mph</div>
                  </div>
                  <div className="text-center p-2 bb-card rounded">
                    <div className="text-xs text-muted uppercase">Gust</div>
                    <div className="text-lg font-bold">{r.wind_gust_mph ?? '—'}</div>
                    <div className="text-xs text-muted">mph</div>
                  </div>
                  <div className="text-center p-2 bb-card rounded">
                    <div className="text-xs text-muted uppercase">Rain</div>
                    <div className="text-lg font-bold">{Math.round((r.precip_prob ?? 0) * 100)}%</div>
                    <div className="text-xs text-muted">{r.precip_in ?? 0}"</div>
                  </div>
                </div>
                
                {r.status === 'OK' && (
                  <div className="text-xs text-emerald-400 bg-emerald-900/20 p-2 rounded">
                    🎯 Perfect conditions - all rules pass
                  </div>
                )}
                
                {r.status === 'CAUTION' && failedRules.length > 0 && (
                  <div className="text-xs text-amber-400 bg-amber-900/20 p-2 rounded">
                    ⚠️ Marginal conditions - {failedRules.join(', ')} outside limits
                  </div>
                )}
                
                {r.status === 'NOT_OK' && failedRules.length > 0 && (
                  <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
                    ❌ Poor conditions - {failedRules.join(', ')} failed
                  </div>
                )}
                
                {idx === 0 && r.status === 'OK' && (
                  <div className="mt-2 text-xs text-muted italic">
                    Bud says: "That's your window right there. Don't let it pass."
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bb-card border-l-4 border-emerald-700/50">
          <img 
            src="/bud-close.png" 
            alt="Bud" 
            className="w-8 h-8 rounded-full float-left mr-2 border border-emerald-700/30"
          />
          <div className="text-xs text-emerald-400 font-medium">Bud's Pro Tip:</div>
          <div className="text-xs text-muted">Green means go, yellow means maybe tomorrow, red means forget about it. And if you spray when it's red, don't come crying to me about drift damage.</div>
        </div>
      </Drawer>
    </main>
  );
}
