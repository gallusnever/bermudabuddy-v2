"use client";
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Chip, Drawer, Input, Tooltip, Icons } from '@bermuda/ui';
import { apiUrl } from '../../lib/api';
import { gddFromHourly, GddModel } from '../../lib/gdd';
import PgrGauge from '../../components/pgr-gauge';
import BudSays, { getRandomTip } from '../../components/bud-says';
import { YardSections } from '../../components/yard-sections';
import { BudProgramDisplay } from '../../components/bud-program-display';
import { UpdateConditionsModal } from '../../components/update-conditions-modal';
import { useAuth } from '../../contexts/auth-context';

type Summary = {
  source: { provider: string; station?: any };
  current?: {
    ts: string;
    wind_mph?: number;
    wind_gust_mph?: number;
    precip_prob?: number;
    precip_in?: number;
    dewpoint_f?: number;
    soil_temp_f?: number;
    et0_in?: number;
    provider: string;
  };
  alerts: { items: any[]; status: string; provider: string };
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [okRows, setOkRows] = useState<any[]>([]);
  const [windSource, setWindSource] = useState<'openmeteo' | 'nws'>('openmeteo');
  const [gddModel, setGddModel] = useState<GddModel>('gdd10');
  const [gddToday, setGddToday] = useState<number | null>(null);
  const [pgrTarget, setPgrTarget] = useState<number>(gddModel === 'gdd10' ? 10 : 20);
  const [areaSqft, setAreaSqft] = useState<number | null>(null);
  const [zones, setZones] = useState<Array<{ id: number; name: string; area_sqft?: number }>>([]);
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [pgrLastGdd0, setPgrLastGdd0] = useState<string | null>(null);
  const [pgrLastGdd10, setPgrLastGdd10] = useState<string | null>(null);
  const [daysSinceLast, setDaysSinceLast] = useState<number | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [editingArea, setEditingArea] = useState<string>("");
  const [showUpdateConditions, setShowUpdateConditions] = useState(false);

  // Prefer profile values for location/area when available
  const cityState = useMemo(() => {
    if (profile?.city || profile?.state) {
      const parts = [profile?.city, profile?.state].filter(Boolean);
      if (parts.length) return parts.join(', ');
    }
    return 'Dallas, TX';
  }, [profile?.city, profile?.state]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const s = await fetch(apiUrl('/api/weather/summary?lat=32.78&lon=-96.80&hours=24')).then(r => r.json());
        setSummary(s);
        const temps = (s.hourlies || []).map((r: any) => r.t_air_f).filter((v: any) => typeof v === 'number');
        const g = gddFromHourly(temps, gddModel);
        setGddToday(g);
        const ok = await fetch(apiUrl(`/api/weather/ok-to-spray?lat=32.78&lon=-96.80&hours=12&wind_source=${windSource}`)).then(r => r.json());
        setOkRows(ok.table || []);
      } catch (e) {
        setOkRows([]);
        setError('Weather temporarily unavailable');
      } finally {
        setLoading(false);
      }
      try {
        const pid = localStorage.getItem('bb_property_id');
        if (pid) {
          setPropertyId(Number(pid));
          const [prop, polys] = await Promise.all([
            fetch(apiUrl(`/api/properties/${pid}`)).then(r => r.json()),
            fetch(apiUrl(`/api/properties/${pid}/polygons`)).then(r => r.json()),
          ]);
          const last0 = prop?.pgr_last_gdd0 || null;
          const last10 = prop?.pgr_last_gdd10 || null;
          setPgrLastGdd0(last0);
          setPgrLastGdd10(last10);
          setZones(polys || []);
          // Prefer profile area if present; otherwise sum zones
          if (profile?.area_sqft) {
            setAreaSqft(Math.round(profile.area_sqft));
          } else {
            const total = (polys || []).reduce((acc: number, p: any) => acc + (p.area_sqft || 0), 0);
            if (total > 0) setAreaSqft(Math.round(total));
          }
          // Reset gauge if last PGR logged today for current model
          const today = new Date().toISOString().slice(0, 10);
          const last = (gddModel === 'gdd10' ? prop?.pgr_last_gdd10 : prop?.pgr_last_gdd0) || null;
          if (last === today) setGddToday(0);
          // Compute days since last for current model
          if (last) {
            const d1 = new Date(last);
            const d2 = new Date(today);
            const diff = Math.floor((d2.getTime() - d1.getTime()) / (1000*60*60*24));
            setDaysSinceLast(diff >= 0 ? diff : null);
          } else {
            setDaysSinceLast(null);
          }
        } else {
          // Fallbacks: profile area, then onboarding localStorage
          if (profile?.area_sqft) {
            setAreaSqft(Math.round(profile.area_sqft));
          } else {
            const onboard = JSON.parse(localStorage.getItem('bb_onboarding') || 'null');
            if (onboard?.area) setAreaSqft(onboard.area);
          }
        }
      } catch {}
    };
    load();
  }, [windSource, gddModel, profile?.area_sqft]);

  async function onLogPgr() {
    try {
      const pid = (localStorage.getItem('bb_property_id'));
      if (pid) {
        await fetch(apiUrl('/api/pgr/apply'), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ property_id: Number(pid), model: gddModel })
        });
        const today = new Date().toISOString().slice(0, 10);
        if (gddModel === 'gdd10') setPgrLastGdd10(today); else setPgrLastGdd0(today);
      }
      setGddToday(0);
      try { localStorage.setItem('bb_pgr_last_model', gddModel); localStorage.setItem('bb_pgr_last_date', new Date().toISOString()); } catch {}
    } catch {}
  }

  const c = summary?.current;
  const alerts = summary?.alerts?.items || [];
  const zonesTooltipText = zones.length > 0 ? zones.map(z => `${z.name || `Zone ${z.id}`}: ${z.area_sqft ? Math.round(z.area_sqft).toLocaleString() : '—'} ft²`).join('\n') : 'No zones saved yet';

  async function onSaveZone() {
    const pid = localStorage.getItem('bb_property_id');
    if (!pid || !editingZoneId) return;
    const body: any = {};
    if (editingName) body.name = editingName;
    if (editingArea) body.area_sqft = Number(editingArea);
    const r = await fetch(apiUrl(`/api/properties/${pid}/polygons/${editingZoneId}`), {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    if (r.ok) {
      const updated = await r.json();
      setZones(prev => prev.map(z => z.id === editingZoneId ? { ...z, name: updated.name, area_sqft: updated.area_sqft } : z));
      setEditingZoneId(null);
      setEditingName("");
      setEditingArea("");
      // recompute area total
      const total = (zones || []).reduce((acc: number, p: any) => acc + (p.area_sqft || 0), 0);
      if (total > 0) setAreaSqft(Math.round(total));
    }
  }

  function onEditZoneStart(z: { id: number; name: string; area_sqft?: number }) {
    setEditingZoneId(z.id);
    setEditingName(z.name || "");
    setEditingArea(z.area_sqft != null ? String(Math.round(z.area_sqft)) : "");
  }

  async function onDeleteZone(id: number) {
    const pid = localStorage.getItem('bb_property_id');
    if (!pid) return;
    if (!confirm('Delete this zone?')) return;
    const r = await fetch(apiUrl(`/api/properties/${pid}/polygons/${id}`), { method: 'DELETE' });
    if (r.ok) {
      setZones(prev => prev.filter(z => z.id !== id));
      const total = (zones || []).filter(z => z.id !== id).reduce((acc: number, p: any) => acc + (p.area_sqft || 0), 0);
      setAreaSqft(total > 0 ? Math.round(total) : null);
    }
  }

  return (
    <main className="container mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted">{cityState} • Provider: {summary?.source.provider}</p>
        </div>
        <Button 
          onClick={() => setShowUpdateConditions(true)}
          variant="outline"
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <Icons.Settings className="h-4 w-4" />
          Update All Conditions
        </Button>
      </div>
      
      {/* Error banner */}
      {error && (
        <div className="mb-4 bb-card p-3 text-sm text-red-300 border border-red-700/40 bg-red-900/20">
          <div className="flex items-center gap-2">
            <Icons.AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        </div>
      )}

      {/* Bud's Daily Wisdom */}
      <div className="mb-6">
        <BudSays category="dashboard" />
      </div>
      
      {/* Yard Sections with Photos */}
      <div className="mb-6">
        <YardSections />
      </div>
      
      {/* Bud's Personalized Program */}
      <div className="mb-6">
        <BudProgramDisplay />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        <Card className="h-full bb-clay">
          <CardHeader><CardTitle className="flex items-center gap-2"><Icons.Layers /> Area</CardTitle></CardHeader>
          <CardContent>
            <Tooltip text={zonesTooltipText}>
              <Chip>{areaSqft != null ? `${areaSqft.toLocaleString()} ft²` : '—'}</Chip>
            </Tooltip>
            <div className="text-sm text-muted">Sum of all zones</div>
          </CardContent>
        </Card>
        <Card className="h-full bb-clay">
          <CardHeader><CardTitle className="flex items-center gap-2"><Icons.LawnLeaf /> Lawn Profile</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted">Grass</div>
              <div>{profile?.grass_type || '—'}</div>
              <div className="text-muted">HOC</div>
              <div>{profile?.hoc != null ? `${profile.hoc}"` : '—'}</div>
              <div className="text-muted">Mower</div>
              <div>{profile?.mower || '—'}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="h-full bb-clay">
          <CardHeader><CardTitle className="flex items-center gap-2"><Icons.Wind /> Wind</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-muted text-sm"><Icons.Spinner className="animate-spin" /> Loading…</div>
            ) : (
              <>
                <Chip>Speed: {c?.wind_mph ?? '—'} mph</Chip>
                <div className="text-sm text-muted">Gust: {c?.wind_gust_mph ?? '—'} mph</div>
                <div className="mt-3 text-xs text-muted">Source: {summary?.source.provider}{summary?.source.station ? ` • Station: ${summary.source.station.name}` : ''}</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="h-full bb-clay">
          <CardHeader><CardTitle className="flex items-center gap-2"><Icons.Droplet /> Moisture</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-muted text-sm"><Icons.Spinner className="animate-spin" /> Loading…</div>
            ) : (
              <>
                <Chip>Precip: {Math.round((c?.precip_prob ?? 0) * 100)}% / {c?.precip_in ?? 0}"</Chip>
                <Tooltip text="Bud says: ET0 is how much water your grass sweats out. Higher number = thirstier grass.">
                  <div className="text-sm text-muted cursor-help">ET0: {c?.et0_in?.toFixed(2) ?? '—'} in</div>
                </Tooltip>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="h-full bb-clay">
          <CardHeader><CardTitle className="flex items-center gap-2"><Icons.Thermometer /> Temps</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-muted text-sm"><Icons.Spinner className="animate-spin" /> Loading…</div>
            ) : (
              <>
                <Tooltip text="Bud says: Dewpoint is when air can't hold more water. High dewpoint = muggy and slow drying.">
                  <Chip className="cursor-help">Dewpoint: {c?.dewpoint_f ?? '—'}°F</Chip>
                </Tooltip>
                <Tooltip text="Bud says: This is what your grass roots actually feel. Below 65°F and Bermuda goes dormant.">
                  <div className="text-sm text-muted cursor-help">Soil: {c?.soil_temp_f ? Math.round(c.soil_temp_f) : '—'}°F</div>
                </Tooltip>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="h-full bb-clay">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icons.Gauge /> GDD Today
              <Tooltip text="Bud says: GDD is like a speedometer for grass growth. It measures heat units that make grass grow.">
                <span className="cursor-help text-xs bb-card px-1.5 py-0.5 rounded">?</span>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Chip>{gddToday != null ? gddToday.toFixed(1) : '—'} {gddModel.toUpperCase()}</Chip>
              <select className="bb-input" value={gddModel} onChange={(e) => setGddModel(e.target.value as GddModel)} aria-label="GDD Model">
                <option value="gdd0">GDD0</option>
                <option value="gdd10">GDD10</option>
              </select>
            </div>
          </CardContent>
        </Card>
        <Card className="h-full bb-clay md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icons.Gauge /> PGR Gauge
              <Tooltip text="Bud says: PGR makes your grass grow sideways instead of up. Like a teenager with a job - more responsible, less wild.">
                <span aria-label="help" className="cursor-help text-xs bb-card px-1.5 py-0.5 rounded">?</span>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-shrink-0">
                <PgrGauge current={gddToday ?? 0} target={pgrTarget} model={gddModel} />
              </div>
              <div className="flex-1 space-y-4 w-full">
                <div className="text-sm text-muted leading-relaxed">
                  This gauge tracks GDD accumulation since your last PGR application. When it reaches 100% of target, reapply.
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium whitespace-nowrap">Target GDD:</label>
                    <input 
                      className="bb-input w-20" 
                      type="number" 
                      min="1"
                      max="100"
                      value={pgrTarget} 
                      onChange={(e) => setPgrTarget(Math.max(1, Number(e.target.value || 10)))} 
                    />
                  </div>
                  <Button variant="soft" className="sm:ml-auto" onClick={onLogPgr}>
                    Log PGR Application
                  </Button>
                </div>
                <div className="text-xs text-muted">
                  Last {gddModel.toUpperCase()} PGR:{' '}
                  {(gddModel === 'gdd10' ? pgrLastGdd10 : pgrLastGdd0) || 'none'}
                  {daysSinceLast != null && <span> • {daysSinceLast} day{daysSinceLast === 1 ? '' : 's'} since</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              OK‑to‑Spray
              <Tooltip text="Bud says: Green means go, yellow means think twice, red means put that sprayer down and grab a beer instead.">
                <span className="cursor-help text-xs bb-card px-1.5 py-0.5 rounded">?</span>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {loading ? (
                <div className="flex items-center gap-2 text-muted text-sm"><Icons.Spinner className="animate-spin" /> Loading…</div>
              ) : (
                <Badge className={okRows?.[0]?.status === 'OK' ? 'bg-emerald-800/30 border-emerald-700/50' : okRows?.[0]?.status === 'CAUTION' ? 'bg-amber-800/30 border-amber-700/50' : 'bg-red-800/30 border-red-700/50'}>
                  {okRows?.[0]?.status ?? '—'}
                </Badge>
              )}
              <Button variant="ghost" onClick={() => setDrawerOpen(true)}>Open hourly table</Button>
              <select className="bb-input" value={windSource} onChange={(e) => setWindSource(e.target.value as any)} aria-label="Wind Source">
                <option value="openmeteo">OpenMeteo</option>
                <option value="nws">NWS (winds)</option>
              </select>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Alerts</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Chip>{alerts.length} active</Chip>
              <Button variant="ghost" onClick={() => setAlertsOpen(true)}>View</Button>
            </div>
            {summary?.alerts.status !== 'ok' && (
              <div className="text-xs text-muted mt-2">Alerts unavailable ({summary?.alerts.status}).</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Zones</CardTitle></CardHeader>
          <CardContent>
            {zones.length === 0 && <div className="text-sm text-muted">No zones saved yet.</div>}
            {zones.length > 0 && (
              <div className="space-y-2">
                {zones.map((z) => (
                  <div key={z.id} className="bb-card p-3 flex items-center justify-between gap-3">
                    {editingZoneId === z.id ? (
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                        <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} aria-label="Zone Name" />
                        <Input value={editingArea} onChange={(e) => setEditingArea(e.target.value)} aria-label="Area (ft2)" placeholder="Area ft²" />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={onSaveZone}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => { setEditingZoneId(null); setEditingName(''); setEditingArea(''); }}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm flex-1">{z.name || `Zone ${z.id}`}</div>
                        <div className="text-xs text-muted">{z.area_sqft ? `${Math.round(z.area_sqft).toLocaleString()} ft²` : '—'}</div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => onEditZoneStart(z)}>Edit</Button>
                          <Button size="sm" variant="ghost" onClick={() => onDeleteZone(z.id)}>Delete</Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* OK-to-Spray Drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Next 12 hours (OK‑to‑Spray)">
        <div className="mb-3 text-xs text-muted">Source: {summary?.source.provider}{summary?.source.station ? ` • Station: ${summary.source.station.name}` : ''}</div>
        <div className="space-y-3">
          {okRows.map((r) => (
            <div key={r.ts} className="bb-card p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-sm font-mono">{new Date(r.ts).toUTCString().slice(17,22)}Z</div>
                <Badge className={
                  r.status === 'OK' ? 'bg-emerald-700/30 border-emerald-600/50' : r.status === 'CAUTION' ? 'bg-amber-700/30 border-amber-600/50' : 'bg-red-700/30 border-red-600/50'}>
                  {r.status}
                </Badge>
                <Badge className="bg-surface2 border-border/50">{r.provider}</Badge>
                <div className="text-xs text-muted">
                  wind {r.wind_mph ?? '—'} mph · gust {r.wind_gust_mph ?? '—'} mph · rain {Math.round((r.precip_prob ?? 0) * 100)}%/{r.precip_in ?? 0}"
                </div>
              </div>
              <div className="flex gap-2">
                {Object.entries(r.rules).map(([k, v]) => (
                  <Badge key={k} className={v ? 'bg-emerald-800/30 border-emerald-700/50' : 'bg-red-800/20 border-red-700/50'}>
                    {k}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Drawer>

      {/* Alerts Drawer */}
      <Drawer open={alertsOpen} onClose={() => setAlertsOpen(false)} title="NWS Alerts">
        <div className="space-y-3">
          {alerts.length === 0 && <div className="text-sm text-muted">No active alerts.</div>}
          {alerts.map((a: any, i: number) => (
            <div key={i} className="bb-card p-3">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-amber-800/30 border-amber-700/50">{a.severity || 'N/A'}</Badge>
                <span className="font-medium">{a.event || a.headline || 'Alert'}</span>
              </div>
              <div className="text-xs text-muted">{a.headline || a.area}</div>
            </div>
          ))}
        </div>
      </Drawer>

      {/* Update Conditions Modal */}
      <UpdateConditionsModal
        isOpen={showUpdateConditions}
        onClose={() => setShowUpdateConditions(false)}
        onUpdate={() => {
          // Reload data after update
          window.location.reload();
        }}
      />
    </main>
  );
}
