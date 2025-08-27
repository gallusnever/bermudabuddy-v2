"use client";
import { useState } from 'react';
import { apiUrl } from '../../lib/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Drawer, Chip, Badge, Icons, Tooltip } from '@bermuda/ui';
import BudSays, { getRandomTip } from '../../components/bud-says';

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
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<HourRow[]>([]);
  const [source, setSource] = useState<{ provider: string; station?: any } | null>(null);

  async function fetchTable() {
    const res = await fetch(apiUrl('/api/weather/ok-to-spray?lat=32.78&lon=-96.80&hours=12'));
    const data = await res.json();
    setRows(data.table);
    setSource(data.source);
    setOpen(true);
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
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="w-full sm:w-auto" onClick={fetchTable}>Fetch for Dallas, TX</Button>
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
              `}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{timeIcon}</div>
                    <div>
                      <div className="text-lg font-bold">
                        {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
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
