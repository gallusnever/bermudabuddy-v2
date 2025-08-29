"use client";
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/auth-context';
import { apiUrl } from '../../lib/api';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Chip, Drawer, Input, Select, Tooltip, Checkbox, Icons } from '@bermuda/ui';
import BudSays, { getRandomTip } from '../../components/bud-says';
import { OnboardingGate } from '../../components/onboarding-gate';

type RateUnit = 'oz_per_1k' | 'lb_per_1k' | 'oz_per_acre' | 'lb_per_acre' | 'fl_oz_per_gal' | 'percent_vv';

type Product = {
  id: string;
  name: string;
  type: 'fert' | 'pgr' | 'herb' | 'fung' | 'insect' | 'bio';
  formulation: string;
  rup?: boolean;
  labelUrl?: string;
  bagCoverageSqft?: number; // optional reference coverage
};

const PRODUCTS: Product[] = [
  {
    id: 'tenex',
    name: 'T-Nex 1L (Trinexapac-ethyl)',
    type: 'pgr',
    formulation: 'ME',
    labelUrl: 'https://www.clearychemicals.com/wp-content/uploads/2016/07/T-Nex-1L-Label.pdf',
  },
  {
    id: 'prodiamine65wdg',
    name: 'Prodiamine 65 WDG',
    type: 'herb',
    formulation: 'WDG',
    labelUrl: 'https://www.cdrex.com/pdf/Prodiamine-65-WDG-Label-25145.pdf',
  },
  {
    id: 'lesco_240_0_fert',
    name: 'LESCO 24-0-0 w/ 0.96% Fe (example)',
    type: 'fert',
    formulation: 'SGN',
    bagCoverageSqft: 12500,
    labelUrl: 'https://www.siteone.com/en/media/p/lesco-24-0-11-50-polyplus-0-96fe-50lb-label.pdf',
  },
  {
    id: 'restricted_example',
    name: 'Restricted Use Example (RUP)',
    type: 'herb',
    formulation: 'EC',
    rup: true,
    labelUrl: 'https://www3.epa.gov/pesticides/chem_search/ppls/000100-01010-20201231.pdf',
  },
];

const WALES_ORDER = ['W', 'A', 'L', 'E', 'S'] as const;
const WALES_EXPLAIN: Record<string, string> = {
  W: 'Wettable: WP, WDG, WSP, DF, WG, SP',
  A: 'Agitate: keep mixing throughout the process',
  L: 'Liquid: SC, SE, F, ME',
  E: 'Emulsifiable: EC, EW, OD',
  S: 'Solubles & Surfactants: SL + adjuvants',
};

function walesBuckets(products: Product[]) {
  const map: Record<string, Product[]> = { W: [], A: [], L: [], E: [], S: [] };
  const W = ['WP', 'WDG', 'WSP', 'DF', 'WG', 'SP'];
  const L = ['SC', 'SE', 'F', 'ME'];
  const E = ['EC', 'EW', 'OD'];
  const S = ['SL'];
  for (const p of products) {
    const f = p.formulation.toUpperCase();
    if (W.includes(f)) map.W.push(p);
    else if (L.includes(f)) map.A.push({ ...p });
    else if (E.includes(f)) map.L.push({ ...p });
    else if (S.includes(f)) map.E.push({ ...p });
    else map.S.push(p);
  }
  return map;
}

export default function MixBuilderPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [selectedIds, setSelectedIds] = useState<string[]>(['tenex']);
  const [area, setArea] = useState<number>(5000);
  const [carrier, setCarrier] = useState<number>(1.0);
  const [tank, setTank] = useState<number>(2.0);
  const [rate, setRate] = useState<number>(1.0);
  const [rateUnit, setRateUnit] = useState<RateUnit>('oz_per_1k');
  const [calc, setCalc] = useState<any | null>(null);
  const [jarOpen, setJarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastBatchId, setLastBatchId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);

  const products = useMemo(() => PRODUCTS.filter(p => selectedIds.includes(p.id)), [selectedIds]);
  const [labelLinks, setLabelLinks] = useState<Record<string, string | undefined>>({});
  const [labelMeta, setLabelMeta] = useState<Record<string, { epa_reg_no?: string; signal_word?: string; rup?: boolean }>>({});
  const hasRup = products.some(p => p.rup) || products.some(p => labelMeta[p.id]?.rup);
  const allHaveLabel = products.every(p => !!(labelLinks[p.id] || p.labelUrl));

  useEffect(() => {
    // Attempt to fetch label links and metadata (signal word, RUP) via curated recipe and persist via API
    async function ensureLabels() {
      const linkUpdates: Record<string, string> = {};
      const metaUpdates: Record<string, { epa_reg_no?: string; signal_word?: string; rup?: boolean }> = {};
      for (const p of products) {
        try {
          // Try by name, then by product id slug
          let r = await fetch(apiUrl(`/api/labels/search?query=${encodeURIComponent(p.name)}`)).then(res => res.json());
          if (!r?.results?.length) {
            r = await fetch(apiUrl(`/api/labels/search?query=${encodeURIComponent(p.id)}`)).then(res => res.json());
          }
          const first = (r?.results || [])[0];
          if (first) {
            if (first.label_pdf_url && !p.labelUrl) linkUpdates[p.id] = first.label_pdf_url;
            metaUpdates[p.id] = { epa_reg_no: first.epa_reg_no, signal_word: first.signal_word, rup: first.rup };
            if (first.epa_reg_no) {
              // Persist and enrich via DB
              try {
                const rr = await fetch(apiUrl(`/api/labels/by-epa?reg_no=${encodeURIComponent(first.epa_reg_no)}`)).then(res => res.json());
                metaUpdates[p.id] = { epa_reg_no: rr.epa_reg_no, signal_word: rr.signal_word, rup: rr.rup };
                if (rr.pdf_url && !p.labelUrl) linkUpdates[p.id] = rr.pdf_url;
              } catch {}
            }
          }
        } catch {}
      }
      if (Object.keys(linkUpdates).length) setLabelLinks(prev => ({ ...prev, ...linkUpdates }));
      if (Object.keys(metaUpdates).length) setLabelMeta(prev => ({ ...prev, ...metaUpdates }));
    }
    ensureLabels();
  }, [products.length]);

  async function doCalc() {
    const res = await fetch(apiUrl('/api/mix/calc'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rate_value: rate, rate_unit: rateUnit, area_sqft: area, carrier_gpa_per_1k: carrier, tank_size_gal: tank })
    });
    const data = await res.json();
    setCalc(data);
  }

  async function doSave() {
    if (hasRup || !allHaveLabel) return;
    setSaveError(null);
    setShowOnboardingBanner(false);
    
    // Try profile first, then localStorage
    const propertyId = profile?.property_id ?? (typeof window !== 'undefined' ? Number(localStorage.getItem('bb_property_id')) : null);
    
    if (!propertyId) {
      setShowOnboardingBanner(true);
      return;
    }
    setSaving(true);
    try {
      const items = products.map(p => ({ product_id: p.id, rate_value: rate, rate_unit: rateUnit }));
      const res = await fetch(apiUrl('/api/applications/bulk'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          area_sqft: area,
          carrier_gpa: carrier,
          tank_size_gal: tank,
          gdd_model: 'gdd10',
          items,
        }),
      });
      if (res.ok) {
        const body = await res.json();
        if (body?.batch_id) {
          setLastBatchId(body.batch_id);
        }
        setSaveError('Application saved! Redirecting...');
        setTimeout(() => {
          router.push('/applications');
        }, 1000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Failed to save: ' + (err.error || res.status));
      }
    } finally {
      setSaving(false);
    }
  }

  const wales = useMemo(() => walesBuckets(products), [products]);
  const consolidatedLabels = useMemo(() => {
    const urls = products.map(p => labelLinks[p.id] || p.labelUrl).filter(Boolean) as string[];
    return Array.from(new Set(urls));
  }, [products, labelLinks]);

  return (
    <main className="container mx-auto max-w-6xl px-6 py-8">
      {showOnboardingBanner && <OnboardingGate />}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-2xl font-semibold">Mix Builder</h1>
        <Button variant="ghost" onClick={() => setJarOpen(true)} className="w-full sm:w-auto">
          <Tooltip text="Bud says: Always jar test when mixing products. Better safe than sorry with a dead lawn.">
            <span>Jar Test</span>
          </Tooltip>
        </Button>
      </div>
      
      {/* Bud's Mixing Wisdom */}
      <div className="mb-6">
        <BudSays category="mix" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Inputs */}
        <Card className="bb-clay">
          <CardHeader><CardTitle className="flex items-center gap-2"><Icons.Beaker /> Inputs</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Select Products</label>
                <div className="space-y-2">
                  {PRODUCTS.map(p => (
                    <div key={p.id} className={p.rup ? 'opacity-50' : ''}>
                      <label className="flex items-center gap-3">
                        <Checkbox checked={selectedIds.includes(p.id)} onChange={(e) => {
                          setSelectedIds(ids => e.target.checked ? [...ids, p.id] : ids.filter(id => id !== p.id));
                        }} />
                        <span>{p.name}</span>
                        {p.rup && <Badge title="Restricted Use Product">RUP</Badge>}
                      </label>
                    </div>
                  ))}
                </div>
                {hasRup && (
                  <div className="mt-2 text-xs text-muted">
                    Restricted Use Products are shown but disabled for non‑licensed users. <a className="underline" href="#" onClick={(e) => { e.preventDefault(); alert('RUP products require certification. Consult your state regulations.'); }}>Learn why</a>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-2">Area (ft²)</label>
                  <Input type="number" value={area} onChange={(e) => setArea(Number(e.target.value || 0))} />
                </div>
                <div>
                  <label className="block text-sm mb-2">Carrier GPA (per 1k)</label>
                  <Input type="number" step="0.1" value={carrier} onChange={(e) => setCarrier(Number(e.target.value || 0))} />
                </div>
                <div>
                  <label className="block text-sm mb-2">Tank Size (gal)</label>
                  <Input type="number" step="0.1" value={tank} onChange={(e) => setTank(Number(e.target.value || 0))} />
                </div>
                <div>
                  <label className="block text-sm mb-2">Rate</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input className="w-full" type="number" step="0.01" value={rate} onChange={(e) => setRate(Number(e.target.value || 0))} />
                    <Select className="w-full sm:w-auto" value={rateUnit} onChange={(e) => setRateUnit(e.target.value as RateUnit)}>
                      <option value="oz_per_1k">oz/1k</option>
                      <option value="lb_per_1k">lb/1k</option>
                      <option value="oz_per_acre">oz/acre</option>
                      <option value="lb_per_acre">lb/acre</option>
                      <option value="fl_oz_per_gal">fl oz/gal</option>
                      <option value="percent_vv">% v/v</option>
                    </Select>
                  </div>
                </div>
              </div>
              <Button onClick={doCalc} variant="primary">Calculate</Button>

              <div className="mt-4 p-3 rounded-md border border-emerald-700/40 bg-emerald-900/10">
                <div className="font-medium">Compliance</div>
                <div className="text-sm text-muted">The label is the law. Ensure each product’s federal label is reviewed before application.</div>
                <ul className="text-sm list-disc pl-5 mt-2">
              {products.map(p => (
                <li key={p.id}>
                  {labelLinks[p.id] || p.labelUrl ? (
                    <a className="underline" target="_blank" href={(labelLinks[p.id] || p.labelUrl)!} rel="noreferrer">{p.name} label</a>
                  ) : (
                    <span className="text-muted">{p.name}: label link unavailable</span>
                  )}
                  {labelMeta[p.id]?.signal_word && (
                    <span className="ml-2 text-xs">• Signal Word: {labelMeta[p.id]?.signal_word}</span>
                  )}
                  {labelMeta[p.id]?.rup && (
                    <Badge className="ml-2" title="Restricted Use Product">RUP</Badge>
                  )}
                </li>
              ))}
              </ul>
            </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-3 items-start sm:items-center">
                <Button className="w-full sm:w-auto" disabled={!allHaveLabel || hasRup || saving} onClick={doSave}>{saving ? 'Saving…' : 'Save Application'}</Button>
                {!allHaveLabel && <div className="text-xs text-muted">Provide label links to enable saving.</div>}
                {hasRup && <div className="text-xs text-muted">RUP present — not saved for non‑licensed users.</div>}
                {saveError && <div className={`text-xs ${saveError.includes('saved') ? 'text-green-500' : 'text-red-500'}`}>{saveError}</div>}
                {lastBatchId && (
                  <a className="underline text-sm" href={`/mix/print?batch_id=${encodeURIComponent(lastBatchId)}`} target="_blank" rel="noreferrer">Print Batch</a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outputs & WALES */}
        <Card className="bb-clay">
          <CardHeader><CardTitle className="flex items-center gap-2"><Icons.Gauge /> Outputs</CardTitle></CardHeader>
          <CardContent>
            {calc ? (
              <div className="space-y-3">
                <Chip>Total Product: {calc.total_product.toFixed(2)} {calc.product_unit}</Chip>
                <Chip>Tanks Needed: {calc.tanks_needed}</Chip>
                <div>
                  <div className="text-sm text-muted mb-1">Per-tank product:</div>
                  <div className="flex flex-wrap gap-2">
                    {calc.per_tank.map((v: number, i: number) => (
                      <Badge key={i}>Tank {i + 1}: {v.toFixed(2)} {calc.product_unit}</Badge>
                    ))}
                  </div>
                </div>
                {calc.per_gallon_concentration && (
                  <Chip>Per-Gallon: {calc.per_gallon_concentration[0]} {calc.per_gallon_concentration[1]}</Chip>
                )}
                <div className="mt-4">
                  <div className="font-medium mb-2">WALES Order</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {WALES_ORDER.map(letter => (
                      <Tooltip key={letter} text={WALES_EXPLAIN[letter]}>
                        <Badge className="bg-surface2 border-border/50">{letter}</Badge>
                      </Tooltip>
                    ))}
                  </div>
                </div>
                <div>
                  <a
                    className="underline"
                    href={`/mix/print?unit=${encodeURIComponent(calc.product_unit)}&total=${encodeURIComponent(calc.total_product.toFixed(2))}&tanks=${encodeURIComponent(String(calc.tanks_needed))}&perTank=${encodeURIComponent((calc.per_tank||[]).map((v:number)=>v.toFixed(2)).join('|'))}&labels=${encodeURIComponent(products.map(p=>labelLinks[p.id]||p.labelUrl||'').filter(Boolean).join(','))}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Garage Sheet (print)
                  </a>
                </div>
                <div className="mt-4">
                  <div className="font-medium mb-1">Consolidated Labels</div>
                  {consolidatedLabels.length === 0 ? (
                    <div className="text-sm text-muted">No label links resolved yet.</div>
                  ) : (
                    <ul className="list-disc pl-5 text-sm">
                      {consolidatedLabels.map((u, i) => (
                        <li key={i}><a className="underline" target="_blank" rel="noreferrer" href={u}>{u}</a></li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted">Enter inputs and calculate to see results.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Drawer open={jarOpen} onClose={() => setJarOpen(false)} title="Jar Test">
        <ol className="list-decimal pl-5 text-sm space-y-2">
          <li>Fill a jar with water matching your spray water.</li>
          <li>Add products in WALES order: W → A → L → E → S.</li>
          <li>Shake/agitate between additions; observe for incompatibilities.</li>
          <li>If precipitate or gel forms, do not mix in tank; consult labels.</li>
        </ol>
      </Drawer>
    </main>
  );
}
