"use client";
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Chip, Badge, Button, Icons, Tooltip } from '@bermuda/ui';
import { apiUrl } from '../../lib/api';
import BudSays from '../../components/bud-says';

type ApplicationRow = {
  id: number;
  product_id: string;
  date?: string;
  rate_value?: number;
  rate_unit?: string;
  area_sqft?: number;
};

export default function ApplicationsPage() {
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [pid, setPid] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const p = localStorage.getItem('bb_property_id');
      setPid(p);
      if (!p) return;
      const r = await fetch(apiUrl(`/api/properties/${p}/applications`)).then(res => res.json());
      setRows(r || []);
    }
    load();
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, ApplicationRow[]>();
    for (const r of rows) {
      const key = (r as any).batch_id || `single_${r.id}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries());
  }, [rows]);

  return (
    <main className="container mx-auto max-w-5xl px-6 py-8">
      {/* Bud's Application Tracking */}
      <div className="mb-6">
        <BudSays>
          Keep track of what you've put down and when. Trust me, your grass remembers everything - especially the mistakes.
        </BudSays>
      </div>
      
      <h1 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        <Icons.Beaker /> Saved Applications
        <Tooltip text="Bud says: Document everything. The EPA loves paperwork almost as much as I love a clean edge.">
          <span className="cursor-help text-xs bb-card px-1.5 py-0.5 rounded">?</span>
        </Tooltip>
      </h1>
      {!pid && (
        <div className="p-4 bb-card border-l-4 border-amber-600">
          <div className="flex items-start gap-3">
            <img src="/bud-close.png" alt="Bud" className="w-10 h-10 rounded-full" />
            <div>
              <div className="text-sm font-medium text-amber-400 mb-1">Hold up there, partner!</div>
              <div className="text-sm text-muted">You need to complete onboarding first. Can't track applications if I don't know your lawn.</div>
              <Button variant="soft" className="mt-2" onClick={() => window.location.href = '/onboarding'}>
                Go to Onboarding
              </Button>
            </div>
          </div>
        </div>
      )}
      {pid && (
        <Card className="bb-clay">
          <CardHeader><CardTitle className="flex items-center gap-2"><Icons.MapPin /> Property #{pid}</CardTitle></CardHeader>
          <CardContent>
            {rows.length === 0 && (
              <div className="p-4 bb-card border-l-4 border-blue-600">
                <div className="flex items-start gap-3">
                  <img src="/bud-close.png" alt="Bud" className="w-10 h-10 rounded-full" />
                  <div>
                    <div className="text-sm font-medium text-blue-400 mb-1">Your application log is empty</div>
                    <div className="text-sm text-muted">Start by mixing something in the Mix Builder. Every application gets logged here automatically.</div>
                    <div className="text-xs text-muted italic mt-2">"An undocumented application is just expensive water."</div>
                  </div>
                </div>
              </div>
            )}
            {rows.length > 0 && (
              <div className="space-y-4">
                {groups.map(([key, items]) => (
                  <div key={key} className="bb-card p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <div className="text-sm font-medium">
                        {key.startsWith('single_') ? (
                          <span className="flex items-center gap-2">
                            📝 Single Application
                            <Tooltip text="Bud says: One product at a time. Simple and effective.">
                              <span className="cursor-help text-xs">ⓘ</span>
                            </Tooltip>
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            📦 Batch {key}
                            <Tooltip text="Bud says: Tank mixing - where the real lawn warriors separate from weekend warriors.">
                              <span className="cursor-help text-xs">ⓘ</span>
                            </Tooltip>
                          </span>
                        )}
                      </div>
                      {key.startsWith('single_') ? (
                        <a className="underline text-sm" href={`/mix/print?app_id=${items[0].id}`} target="_blank" rel="noreferrer">🖨️ Print</a>
                      ) : (
                        <a className="underline text-sm" href={`/mix/print?batch_id=${encodeURIComponent(key)}`} target="_blank" rel="noreferrer">🖨️ Print Batch</a>
                      )}
                    </div>
                    <div className="space-y-2">
                      {items.map((r) => (
                        <div key={r.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge>{r.product_id}</Badge>
                            <div className="text-sm">{r.rate_value} {r.rate_unit}</div>
                            <div className="text-xs text-muted">Area {r.area_sqft?.toLocaleString?.() || '—'} ft²</div>
                          </div>
                          <div className="text-sm">{r.date || '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
