"use client";
export const dynamic = 'force-dynamic';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../../../lib/api';

type AppRow = {
  id: number;
  property_id: number;
  product_id: string;
  date?: string;
  rate_value?: number;
  rate_unit?: string;
  area_sqft?: number;
  carrier_gpa?: number;
  tank_size_gal?: number;
};

export default function GarageSheetPage() {
  const [appId, setAppId] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [row, setRow] = useState<AppRow | null>(null);
  const [calc, setCalc] = useState<any | null>(null);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<any | null>(null);
  const [batchItems, setBatchItems] = useState<AppRow[] | null>(null);
  const [batchCalcs, setBatchCalcs] = useState<any[] | null>(null);
  const [batchLabelUrls, setBatchLabelUrls] = useState<Record<string, string>>({});
  const batchUniqueLabels = useMemo(() => {
    const m = new Map<string, string>();
    for (const [pid, url] of Object.entries(batchLabelUrls)) {
      if (url) m.set(url, pid);
    }
    return Array.from(m.keys());
  }, [batchLabelUrls]);

  const [spRaw, setSpRaw] = useState<URLSearchParams | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const usp = new URLSearchParams(window.location.search);
      setSpRaw(usp);
      setAppId(usp.get('app_id'));
      setBatchId(usp.get('batch_id'));
    }
  }, []);
  const productUnit = useMemo(() => (calc?.product_unit || spRaw?.get('unit') || ''), [calc, spRaw]);
  const total = useMemo(() => (calc ? String(calc.total_product.toFixed(2)) : (spRaw?.get('total') || '')), [calc, spRaw]);
  const tanks = useMemo(() => (calc ? String(calc.tanks_needed) : (spRaw?.get('tanks') || '')), [calc, spRaw]);
  const perTankVals = useMemo(() => (calc ? calc.per_tank.map((v: number) => v.toFixed(2)) : (spRaw?.get('perTank') ? spRaw.get('perTank')!.split('|') : [])), [calc, spRaw]);
  const labels = useMemo(() => (labelUrl ? [labelUrl] : ((spRaw?.get('labels') || '') as string).split(',').filter(Boolean)), [labelUrl, spRaw]);
  const wales = ['W: Wettable powders (WP/WDG/WSP/DF/WG/SP)', 'A: Agitate throughout mixing', 'L: Liquids (SC/SE/F/ME)', 'E: Emulsifiables (EC/EW/OD)', 'S: Solubles & surfactants (SL/adjuvants)'];

  useEffect(() => {
    async function load() {
      try {
        if (appId) {
          const r = await fetch(apiUrl(`/api/applications/${appId}`)).then(res => res.json());
          setRow(r);
          setSnapshot(r?.weather_snapshot || null);
          if (r?.rate_value && r?.rate_unit && r?.area_sqft && r?.carrier_gpa && r?.tank_size_gal) {
            const cm = await fetch(apiUrl('/api/mix/calc'), {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                rate_value: r.rate_value,
                rate_unit: r.rate_unit,
                area_sqft: r.area_sqft,
                carrier_gpa_per_1k: r.carrier_gpa,
                tank_size_gal: r.tank_size_gal,
              }),
            }).then(res => res.json());
            setCalc(cm);
          }
          if (r?.product_id) {
            try {
              const s = await fetch(apiUrl(`/api/labels/search?query=${encodeURIComponent(r.product_id)}`)).then(res => res.json());
              const first = (s?.results || [])[0];
              if (first?.label_pdf_url) setLabelUrl(first.label_pdf_url);
            } catch {}
          }
        } else if (batchId) {
          const items: AppRow[] = await fetch(apiUrl(`/api/application-batches/${encodeURIComponent(batchId)}`)).then(res => res.json());
          setBatchItems(items);
          const calcs: any[] = [];
          for (const it of items) {
            if (it?.rate_value && it?.rate_unit && it?.area_sqft && it?.carrier_gpa && it?.tank_size_gal) {
              const cm = await fetch(apiUrl('/api/mix/calc'), {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  rate_value: it.rate_value,
                  rate_unit: it.rate_unit,
                  area_sqft: it.area_sqft,
                  carrier_gpa_per_1k: it.carrier_gpa,
                  tank_size_gal: it.tank_size_gal,
                }),
              }).then(res => res.json());
              calcs.push(cm);
            } else {
              calcs.push(null);
            }
          }
          setBatchCalcs(calcs);
          // Resolve label links per item
          const urls: Record<string, string> = {};
          for (const it of items) {
            try {
              const s = await fetch(apiUrl(`/api/labels/search?query=${encodeURIComponent(it.product_id)}`)).then(res => res.json());
              const first = (s?.results || [])[0];
              if (first?.label_pdf_url) urls[it.product_id] = first.label_pdf_url;
            } catch {}
          }
          setBatchLabelUrls(urls);
        }
      } catch {}
    }
    load();
  }, [appId, batchId]);

  return (
    <Suspense fallback={<main className="container mx-auto max-w-3xl p-6 print:p-0"><h1 className="text-2xl font-semibold">Garage Sheet</h1><div className="text-sm text-muted">Loading…</div></main>}>
    <main className="container mx-auto max-w-3xl p-6 print:p-0">
      <div className="flex items-start gap-3 mb-4 print:hidden">
        <img 
          src="/bud-close.png" 
          alt="Bud" 
          className="w-12 h-12 rounded-full border-2 border-emerald-700"
        />
        <div>
          <h1 className="text-2xl font-bold mb-1">Bud's Garage Sheet</h1>
          <div className="text-sm text-emerald-400">"Keep this on your sprayer. It's like a flight checklist, but for grass."</div>
        </div>
      </div>
      
      <h1 className="text-2xl font-semibold mb-2 hidden print:block">Garage Sheet</h1>
      
      <div className="bb-card p-3 mb-4 border-l-4 border-amber-600">
        <div className="font-bold text-amber-400 mb-1">⚠️ Safety First</div>
        <div className="text-sm">
          <div className="mb-1">PPE Required: Gloves, long sleeves, eye protection</div>
          <div className="mb-1">The label is the law — review each product label before mixing</div>
          <div className="text-xs text-muted italic">Bud says: "Chemical burns ain't a badge of honor. Suit up."</div>
        </div>
      </div>
      {snapshot && (
        <section className="mb-6 bb-card p-3">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            🌤️ Weather at Application
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted uppercase">Wind Speed</div>
              <div className="text-lg font-bold">{snapshot?.current?.wind_mph ?? '—'} mph</div>
            </div>
            <div>
              <div className="text-xs text-muted uppercase">Gust Speed</div>
              <div className="text-lg font-bold">{snapshot?.current?.wind_gust_mph ?? '—'} mph</div>
            </div>
            <div>
              <div className="text-xs text-muted uppercase">Rain Chance</div>
              <div className="text-lg font-bold">{snapshot?.current?.precip_prob != null ? Math.round((snapshot.current.precip_prob || 0) * 100) : '—'}%</div>
            </div>
            <div>
              <div className="text-xs text-muted uppercase">Provider</div>
              <div className="text-lg font-bold">{snapshot?.source?.provider || '—'}</div>
            </div>
          </div>
          {snapshot?.alerts?.items?.length > 0 && (
            <div className="mt-2 text-xs text-amber-400 bg-amber-900/20 p-2 rounded">
              ⚠️ Active weather alerts: {snapshot.alerts.items.length}
            </div>
          )}
        </section>
      )}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
          🧮 Product Calculations
        </h2>
        {batchItems ? (
          <div className="space-y-3">
            {batchItems.map((it, idx) => (
              <div key={it.id} className="bb-card p-3">
                <div className="font-medium mb-1">{it.product_id}</div>
                <div>
                  Total product: <strong>{batchCalcs?.[idx]?.total_product?.toFixed?.(2) ?? '—'} {batchCalcs?.[idx]?.product_unit ?? ''}</strong>
                </div>
                <div>Tanks needed: <strong>{batchCalcs?.[idx]?.tanks_needed ?? '—'}</strong></div>
                {batchCalcs?.[idx]?.per_tank && (
                  <div className="mt-1">
                    <div className="font-medium mb-1">Per-tank</div>
                    <ul className="list-disc pl-5">
                      {batchCalcs?.[idx]?.per_tank?.map((v: number, i: number) => (
                        <li key={i}>Tank {i + 1}: {v.toFixed(2)} {batchCalcs?.[idx]?.product_unit}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <>
            <div>Total product: <strong>{total} {productUnit}</strong></div>
            <div>Tanks needed: <strong>{tanks}</strong></div>
            <div className="mt-2">
              <div className="font-medium mb-1">Per-tank</div>
              <ul className="list-disc pl-5">
                {perTankVals.map((v, i) => (
                  <li key={i}>Tank {i + 1}: {v} {productUnit}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </section>
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
          🧪 WALES Mixing Order
          <span className="text-xs font-normal text-muted">(Don't mess this up)</span>
        </h2>
        <div className="bb-card p-3 border-l-4 border-blue-600">
          <ol className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-400">W:</span>
              <div>
                <span className="font-medium">Wettable powders</span>
                <div className="text-xs text-muted">WP, WDG, WSP, DF, WG, SP - Add to water first, mix thoroughly</div>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-400">A:</span>
              <div>
                <span className="font-medium">Agitate</span>
                <div className="text-xs text-muted">Keep mixing throughout - Bud says: "Like a martini, but deadlier"</div>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-400">L:</span>
              <div>
                <span className="font-medium">Liquids</span>
                <div className="text-xs text-muted">SC, SE, F, ME - Flowables and suspensions</div>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-400">E:</span>
              <div>
                <span className="font-medium">Emulsifiables</span>
                <div className="text-xs text-muted">EC, EW, OD - Oil-based products</div>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-400">S:</span>
              <div>
                <span className="font-medium">Solubles & Surfactants</span>
                <div className="text-xs text-muted">SL, adjuvants - Always add last</div>
              </div>
            </li>
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-2">Labels</h2>
        {batchItems ? (
          <ul className="list-disc pl-5">
            {batchItems.map((it, idx) => (
              <li key={it.id}>
                {it.product_id}:{' '}
                {batchLabelUrls[it.product_id] ? (
                  <a className="underline" target="_blank" rel="noreferrer" href={batchLabelUrls[it.product_id]}>Label PDF</a>
                ) : (
                  <span className="text-muted">label unavailable</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <ul className="list-disc pl-5">
            {labels.map((u, i) => (
              <li key={i}><a className="underline" href={u} target="_blank" rel="noreferrer">{u}</a></li>
            ))}
          </ul>
        )}
      </section>

      {(batchItems && batchUniqueLabels.length > 0) ? (
        <section className="mt-4">
          <h3 className="text-md font-semibold mb-2">Labels Summary</h3>
          <ul className="list-disc pl-5">
            {batchUniqueLabels.map((u, i) => (
              <li key={i}><a className="underline" href={u} target="_blank" rel="noreferrer">{u}</a></li>
            ))}
          </ul>
        </section>
      ) : null}
      
      <div className="mt-6 p-3 bb-card border-t-4 border-emerald-600 print:hidden">
        <div className="flex items-center gap-2 mb-2">
          <img src="/bud-close.png" alt="Bud" className="w-8 h-8 rounded-full" />
          <div className="font-bold text-emerald-400">Bud's Final Check</div>
        </div>
        <div className="text-sm space-y-1">
          <div>✓ Weather checked? (No rain for 2 hours)</div>
          <div>✓ PPE on? (Don't be a hero)</div>
          <div>✓ Sprayer calibrated? (Measure twice, spray once)</div>
          <div>✓ Neighbors warned? (Keep the peace)</div>
        </div>
        <div className="text-xs text-muted italic mt-2">"If something goes wrong and you didn't follow the label, that's on you, not me."</div>
      </div>
      <style jsx global>{`
        @media print { body { background: white !important; color: black !important; } a { color: black; } }
      `}</style>
    </main>
    </Suspense>
  );
}
