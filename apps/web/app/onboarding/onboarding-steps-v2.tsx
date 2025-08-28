"use client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Icons } from '@bermuda/ui';
import BudSays, { getStateTip } from '../../components/bud-says';
import { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

// Step 3: Property Map & Zone Mapping (using location from step 2)
export function PropertyLocationStep({ locationData, onNext }: { locationData: any; onNext: (data: any) => void }) {
  // Use location data from previous step
  const address = locationData?.address || "";
  const city = locationData?.city || "";
  const state = locationData?.state || "TX";
  const zip = locationData?.zip || "";
  
  const [area, setArea] = useState<number>(5000);
  const [stateTip, setStateTip] = useState<string | null>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [currentZoneName, setCurrentZoneName] = useState('Front Yard');
  const [drawMode, setDrawMode] = useState<'single' | 'zones'>('single');
  
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapInstance = useRef<any>(null);
  const drawRef = useRef<any>(null);
  
  useEffect(() => {
    if (state) {
      const tip = getStateTip(state);
      setStateTip(tip);
    }
  }, [state]);
  
  useEffect(() => {
    if (!mapRef.current) {
      console.error('[Map] Map container not ready');
      return;
    }

    // Import config to get the token that was baked in at build time
    import('../../lib/config').then(({ default: config }) => {
      const token = config.mapboxToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      console.log('[Map] Mapbox token available:', !!token);
      console.log('[Map] Token first 10 chars:', token?.substring(0, 10));
      
      if (!token) {
        console.error('[Map] No Mapbox token available!');
        setMapReady(false);
        return;
      }
      
      if (!mapRef.current) {
        console.error('[Map] Container disappeared during async load');
        return;
      }
      
      try {
        (mapboxgl as any).accessToken = token;
        const map = new (mapboxgl as any).Map({
          container: mapRef.current!,
          style: 'mapbox://styles/mapbox/satellite-streets-v12',
          center: [-96.8, 32.78],
          zoom: 12,
        });
    
        const Draw = new (MapboxDraw as any)({ 
          displayControlsDefault: false, 
          controls: { polygon: true, trash: true },
        });
        
        map.addControl(Draw);
        map.addControl(new (mapboxgl as any).NavigationControl(), 'top-right');
        
        const updateArea = () => {
          try {
            const data = Draw.getAll();
            if (!data.features.length) return;
            
            if (drawMode === 'single') {
              const meters = turf.area(data.features[0] as any);
              const sqft = meters * 10.7639;
              setArea(Math.round(sqft));
            } else {
              // Multiple zones mode
              let totalArea = 0;
              const newZones = data.features.map((feature: any, idx: number) => {
                const meters = turf.area(feature);
                const sqft = meters * 10.7639;
                totalArea += sqft;
                return {
                  id: feature.id,
                  name: zones[idx]?.name || `Zone ${idx + 1}`,
                  area: Math.round(sqft),
                  geojson: feature
                };
              });
              setZones(newZones);
              setArea(Math.round(totalArea));
            }
          } catch {}
        };
      
        map.on('draw.create', updateArea);
        map.on('draw.update', updateArea);
        map.on('draw.delete', () => {
          if (drawMode === 'single') {
            setArea('');
          } else {
            updateArea();
          }
        });
        map.on('load', () => {
          console.log('[Map] Successfully loaded!');
          setMapReady(true);
        });
        
        map.on('error', (e: any) => {
          console.error('[Map] Mapbox error:', e);
        });
        
        mapInstance.current = map;
        drawRef.current = Draw;
      } catch (error) {
        console.error('[Map] Failed to initialize Mapbox:', error);
        setMapReady(false);
      }
    }).catch(err => {
      console.error('[Map] Failed to load config:', err);
    });
  }, []);
  
  // Auto-center map on address when map is ready
  useEffect(() => {
    if (mapReady && address && city && state) {
      geocodeAddress();
    }
  }, [mapReady, address, city, state]);
  
  async function geocodeAddress() {
    if (!address || !city || !state) return;
    const fullAddress = `${address}, ${city}, ${state} ${zip}`;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !mapInstance.current) return;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${token}&limit=1`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        mapInstance.current.flyTo({ center: [lng, lat], zoom: 17, essential: true });
        // Store coordinates in location data
        if (locationData) {
          locationData.lat = lat;
          locationData.lon = lng;
          locationData.latitude = lat;
          locationData.longitude = lng;
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  }
  
  const handleNext = () => {
    // Map drawing is optional, just pass along the data
    const geojson = drawRef.current?.getAll();
    const mapArea = geojson?.features?.length > 0 ? 
      Math.round(turf.area(geojson) * 10.764) : // Convert m² to ft²
      area; // Use area from step 2
    
    // Get current map center as user's coordinates
    const center = mapInstance.current?.getCenter();
    
    onNext({ 
      area: mapArea,
      geojson, 
      zones: drawMode === 'zones' ? zones : [],
      lat: center?.lat || locationData.lat,
      lon: center?.lng || locationData.lon,
      longitude: center?.lng || locationData.lon,
      latitude: center?.lat || locationData.lat
    });
  };
  
  return (
    <Card className="bb-clay">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.MapPin /> Draw Your Property
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <BudSays>
            Alright, I know you live at {address} in {city}, {state}. The map should be centered on your property. Draw your lawn boundaries to calculate the exact area, or just enter it manually below.
          </BudSays>
          
          {/* Display location info from step 2 */}
          <div className="bg-gray-700 rounded-lg p-4 text-sm">
            <div className="text-gray-300 mb-1">Your Property:</div>
            <div className="text-white font-medium">{address}</div>
            <div className="text-gray-400">{city}, {state} {zip}</div>
          </div>
          
          {stateTip && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <BudSays>{stateTip}</BudSays>
            </div>
          )}
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">
                Area: {area ? `${area.toLocaleString()} ft²` : 'Draw on map or enter manually'}
              </label>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={drawMode === 'single' ? 'default' : 'ghost'}
                  onClick={() => setDrawMode('single')}
                >
                  Single Area
                </Button>
                <Button 
                  size="sm" 
                  variant={drawMode === 'zones' ? 'default' : 'ghost'}
                  onClick={() => setDrawMode('zones')}
                >
                  Multiple Zones
                </Button>
              </div>
            </div>
            
            {drawMode === 'zones' && zones.length > 0 && (
              <div className="mb-3 p-3 bb-card rounded-lg space-y-2">
                <div className="text-xs font-medium mb-2">Zones Mapped:</div>
                {zones.map((zone, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      className="h-7 text-xs"
                      value={zone.name}
                      onChange={(e) => {
                        const newZones = [...zones];
                        newZones[idx].name = e.target.value;
                        setZones(newZones);
                      }}
                      placeholder={`Zone ${idx + 1} name`}
                    />
                    <span className="text-xs text-muted whitespace-nowrap">
                      {zone.area.toLocaleString()} ft²
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="h-96 w-full bb-card overflow-hidden relative rounded-lg">
              <div ref={mapRef} className="absolute inset-0" />
              {!mapReady && (
                <div className="absolute inset-0 grid place-items-center text-sm text-muted p-4 text-center">
                  Loading map... Draw your property boundaries to calculate area.
                </div>
              )}
            </div>
            <div className="mt-3 space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Or enter your lawn area manually:
              </label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  placeholder="e.g., 5000" 
                  value={area}
                  onChange={(e) => setArea(parseInt(e.target.value) || 0)}
                  className="bg-gray-700 text-white"
                />
                <span className="text-gray-400 self-center">sq ft</span>
              </div>
              <p className="text-xs text-gray-400">
                Tip: Draw on the map for accurate calculation, or just type your known square footage
              </p>
            </div>
          </div>
          
          <Button onClick={handleNext} className="w-full">
            {drawRef.current?.getAll()?.features?.length > 0 ? 'Next: Equipment' : 'Skip Map (Use entered area)'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 2: Equipment & Maintenance Capabilities
export function EquipmentStep({ onNext, onBack }: { onNext: (data: any) => void; onBack: () => void }) {
  const [grassType, setGrassType] = useState('');
  const [mower, setMower] = useState('');
  const [hoc, setHoc] = useState<number | ''>('');
  const [irrigation, setIrrigation] = useState('');
  const [spreader, setSpreader] = useState('');
  const [sprayer, setSprayer] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [weeklyTime, setWeeklyTime] = useState('');
  const [soilTestDone, setSoilTestDone] = useState(false);
  const [soilTestResults, setSoilTestResults] = useState({
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    ph: '',
    organic: ''
  });
  
  const handleNext = () => {
    if (!grassType || !mower || !hoc || !irrigation || !monthlyBudget || !weeklyTime) {
      alert('Please fill in all required fields');
      return;
    }
    onNext({ 
      grassType, mower, hoc, irrigation, spreader, sprayer, 
      monthlyBudget, weeklyTime, soilTestDone, soilTestResults 
    });
  };
  
  return (
    <Card className="bb-clay">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.Gauge /> Equipment & Resources
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <BudSays>
            Let's see what tools you're working with. This helps me know if I should recommend granular products from Lowe's or if you're ready for the good stuff.
          </BudSays>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm mb-2 font-medium">Bermuda Grass Variety</label>
              <Select value={grassType} onChange={(e) => setGrassType(e.target.value)}>
                <option value="">Select your variety...</option>
                <option value="common">Common Bermuda - The OG</option>
                <option value="tifway419">Tifway 419 - Golf course classic</option>
                <option value="tifsport">TifSport - Athletic field favorite</option>
                <option value="tiftuf">TifTuf - Drought champion</option>
                <option value="celebration">Celebration - Deep blue-green beauty</option>
                <option value="latitude36">Latitude 36 - Cold tolerant beast</option>
                <option value="northbridge">NorthBridge - Cold weather warrior</option>
                <option value="tahoma31">Tahoma 31 - Fine texture king</option>
                <option value="ironcutter">Iron Cutter - Tough as nails</option>
                <option value="monaco">Monaco - Putting green quality</option>
                <option value="unknown">Not sure - Let's figure it out</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-2 font-medium">Mower Type</label>
              <Select value={mower} onChange={(e) => setMower(e.target.value)}>
                <option value="">Select your mower...</option>
                <option value="push-rotary">Push Rotary - The workout special</option>
                <option value="self-propelled">Self-Propelled Rotary - Smart choice</option>
                <option value="riding-rotary">Riding Rotary - Living the dream</option>
                <option value="reel-manual">Manual Reel - Old school cool</option>
                <option value="reel-powered">Powered Reel - You're serious</option>
                <option value="robot">Robot - Living in 2050</option>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm mb-2 font-medium">Height of Cut (inches)</label>
              <Input type="number" step="0.1" placeholder="0.75" value={hoc as any} 
                onChange={(e) => setHoc(e.target.value ? Number(e.target.value) : '')} />
              <div className="text-xs text-muted mt-1">Lower = better for Bermuda (0.5-1.0" ideal)</div>
            </div>
            
            <div>
              <label className="block text-sm mb-2 font-medium">Irrigation System</label>
              <Select value={irrigation} onChange={(e) => setIrrigation(e.target.value)}>
                <option value="">Select irrigation...</option>
                <option value="none">None - Rain dancing only</option>
                <option value="hose">Hose & sprinkler - Manual mode</option>
                <option value="auto">In-ground automatic - Set and forget</option>
                <option value="smart">Smart controller - Weather-based</option>
              </Select>
            </div>
            
            {sprayer === 'none' || !sprayer ? (
              <div>
                <label className="block text-sm mb-2 font-medium">Spreader Model</label>
                <Select value={spreader} onChange={(e) => setSpreader(e.target.value)}>
                  <option value="">Select spreader...</option>
                  <option value="none">None yet</option>
                  <optgroup label="Budget Options">
                    <option value="scotts-edgeguard">Scotts EdgeGuard Mini</option>
                    <option value="scotts-turf-builder">Scotts Turf Builder</option>
                    <option value="vigoro-broadcast">Vigoro Broadcast</option>
                  </optgroup>
                  <optgroup label="Mid-Range">
                    <option value="earthway-2150">Earthway 2150</option>
                    <option value="scotts-elite">Scotts Elite</option>
                    <option value="agrifab-45-0463">Agri-Fab 45-0463</option>
                  </optgroup>
                  <optgroup label="Professional">
                    <option value="lesco-80lb">Lesco 80lb</option>
                    <option value="earthway-2170">Earthway 2170 Pro</option>
                    <option value="spyker-p20-5010">Spyker P20-5010</option>
                  </optgroup>
                </Select>
              </div>
            ) : null}
            
            <div>
              <label className="block text-sm mb-2 font-medium">Sprayer Equipment</label>
              <Select value={sprayer} onChange={(e) => setSprayer(e.target.value)}>
                <option value="">Select sprayer...</option>
                <option value="none">None - Granular only</option>
                <optgroup label="Manual Pump">
                  <option value="chapin-1gal">Chapin 1 Gallon</option>
                  <option value="chapin-2gal">Chapin 2 Gallon</option>
                  <option value="hdx-2gal">HDX 2 Gallon (Home Depot)</option>
                </optgroup>
                <optgroup label="Battery Powered">
                  <option value="ego-backpack">EGO 4 Gallon Backpack</option>
                  <option value="flowzone-typhoon">FlowZone Typhoon 2.5</option>
                  <option value="flowzone-cyclone">FlowZone Cyclone 4</option>
                  <option value="sprayers-plus-105ex">Sprayers Plus 105Ex</option>
                </optgroup>
                <optgroup label="Pull-Behind">
                  <option value="northstar-31gal">NorthStar 31 Gallon</option>
                  <option value="agrifab-15gal">Agri-Fab 15 Gallon</option>
                  <option value="precision-15gal">Precision 15 Gallon</option>
                </optgroup>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm mb-2 font-medium">Monthly Budget for Products</label>
              <Select value={monthlyBudget} onChange={(e) => setMonthlyBudget(e.target.value)}>
                <option value="">How much for lawn products?</option>
                <option value="50">Under $50/mo - Just the basics</option>
                <option value="100">$50-100/mo - Room to experiment</option>
                <option value="200">$100-200/mo - Getting serious</option>
                <option value="300">$200-300/mo - All the good stuff</option>
                <option value="500">$300-500/mo - Professional grade</option>
                <option value="unlimited">$500+/mo - Domination mode</option>
              </Select>
              <div className="text-xs text-muted mt-1">This is for fertilizer, chemicals, etc. - NOT what we charge</div>
            </div>
            
            <div>
              <label className="block text-sm mb-2 font-medium">Time Available (per week)</label>
              <Select value={weeklyTime} onChange={(e) => setWeeklyTime(e.target.value)}>
                <option value="">Select time...</option>
                <option value="2">Less than 2 hours</option>
                <option value="5">2-5 hours</option>
                <option value="10">5-10 hours</option>
                <option value="15">10-15 hours</option>
                <option value="unlimited">It's my main hobby</option>
              </Select>
            </div>
          </div>

          {/* Soil Test Section */}
          <div className="bb-card p-4 space-y-4">
            <label className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={soilTestDone} 
                onChange={(e) => setSoilTestDone(e.target.checked)}
                className="rounded"
              />
              <span className="font-medium">I have recent soil test results</span>
            </label>
            
            {soilTestDone && (
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="block text-xs mb-1">Nitrogen (lbs/1000 ft²)</label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    placeholder="0.5" 
                    value={soilTestResults.nitrogen}
                    onChange={(e) => setSoilTestResults(prev => ({...prev, nitrogen: e.target.value}))}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Phosphorus (ppm)</label>
                  <Input 
                    type="number" 
                    placeholder="25" 
                    value={soilTestResults.phosphorus}
                    onChange={(e) => setSoilTestResults(prev => ({...prev, phosphorus: e.target.value}))}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Potassium (ppm)</label>
                  <Input 
                    type="number" 
                    placeholder="120" 
                    value={soilTestResults.potassium}
                    onChange={(e) => setSoilTestResults(prev => ({...prev, potassium: e.target.value}))}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">pH Level</label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    placeholder="6.5" 
                    value={soilTestResults.ph}
                    onChange={(e) => setSoilTestResults(prev => ({...prev, ph: e.target.value}))}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Organic Matter (%)</label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    placeholder="2.5" 
                    value={soilTestResults.organic}
                    onChange={(e) => setSoilTestResults(prev => ({...prev, organic: e.target.value}))}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onBack}>Back</Button>
            <Button onClick={handleNext} className="flex-1">Next: Current Lawn Status</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 3: Current Lawn Status & Issues
export function LawnStatusStep({ onNext, onBack, locationData }: { onNext: (data: any) => void; onBack: () => void; locationData: any }) {
  const [lawnAge, setLawnAge] = useState('');
  const [lastSoilTest, setLastSoilTest] = useState('');
  const [shade, setShade] = useState('');
  const [issues, setIssues] = useState<string[]>([]);
  const [primaryConcern, setPrimaryConcern] = useState('');
  
  const issuesList = [
    { id: 'weeds-pre', label: 'Weeds breaking through', tip: 'Pre-emergent window likely missed' },
    { id: 'weeds-existing', label: 'Existing weeds', tip: 'Need post-emergent treatment' },
    { id: 'disease', label: 'Disease/Fungus', tip: 'May need fungicide rotation' },
    { id: 'thin', label: 'Thin/Bare spots', tip: 'Could be multiple causes' },
    { id: 'shade', label: 'Shade damage', tip: 'Bermuda needs 6+ hours sun' },
    { id: 'compaction', label: 'Soil compaction', tip: 'Aeration may help' },
    { id: 'thatch', label: 'Thatch buildup', tip: 'Verticut or dethatch needed' },
    { id: 'insects', label: 'Insect damage', tip: 'Check for grubs/armyworms' },
    { id: 'color', label: 'Poor color', tip: 'Likely nitrogen/iron deficiency' },
    { id: 'growth', label: 'Slow growth', tip: 'Check soil temp and pH' },
    { id: 'scalping', label: 'Scalping issues', tip: 'HOC may be too high' },
    { id: 'none', label: 'No major issues', tip: 'Maintenance mode!' },
  ];
  
  const handleNext = () => {
    if (!lawnAge || !shade || issues.length === 0) {
      alert('Please fill in all fields');
      return;
    }
    onNext({ lawnAge, lastSoilTest, shade, issues, primaryConcern });
  };
  
  return (
    <Card className="bb-clay">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.LawnLeaf /> Current Lawn Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <BudSays>
            Now for the moment of truth. Let's assess what we're working with. No judgment - every great lawn started somewhere.
          </BudSays>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm mb-2 font-medium">Lawn Age</label>
              <Select value={lawnAge} onChange={(e) => setLawnAge(e.target.value)}>
                <option value="">Select age...</option>
                <option value="new">Brand new (&lt; 1 year)</option>
                <option value="establishing">Establishing (1-3 years)</option>
                <option value="mature">Mature (3+ years)</option>
                <option value="unknown">Not sure</option>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm mb-2 font-medium">Last Soil Test</label>
              <Select value={lastSoilTest} onChange={(e) => setLastSoilTest(e.target.value)}>
                <option value="">Select...</option>
                <option value="never">Never - Flying blind</option>
                <option value="recent">This year</option>
                <option value="old">1-2 years ago</option>
                <option value="ancient">3+ years ago</option>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm mb-2 font-medium">Shade Amount</label>
              <Select value={shade} onChange={(e) => setShade(e.target.value)}>
                <option value="">Select shade...</option>
                <option value="full-sun">Full sun (8+ hours)</option>
                <option value="mostly-sun">Mostly sun (6-8 hours)</option>
                <option value="part-shade">Part shade (4-6 hours)</option>
                <option value="heavy-shade">Heavy shade (&lt; 4 hours)</option>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm mb-3 font-medium">Current Issues (check all that apply)</label>
            <div className="space-y-2">
              {issuesList.map(issue => (
                <label key={issue.id} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={issues.includes(issue.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setIssues([...issues, issue.id]);
                      } else {
                        setIssues(issues.filter(i => i !== issue.id));
                      }
                    }}
                    className="rounded mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{issue.label}</span>
                    <span className="text-xs text-muted block">{issue.tip}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          {issues.length > 0 && !issues.includes('none') && (
            <div>
              <label className="block text-sm mb-2 font-medium">What's your #1 concern right now?</label>
              <Input 
                placeholder="e.g., Neighbors lawn looks better, weeds taking over, etc." 
                value={primaryConcern}
                onChange={(e) => setPrimaryConcern(e.target.value)}
              />
            </div>
          )}
          
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onBack}>Back</Button>
            <Button onClick={handleNext} className="flex-1">Next: Get Your Program</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 4: Program Recommendation & Action Plan
export function ProgramRecommendationStep({ 
  onNext, 
  onBack, 
  allData 
}: { 
  onNext: () => void; 
  onBack: () => void; 
  allData: any;
}) {
  // Calculate recommended program based on all inputs
  const getRecommendedProgram = () => {
    const budget = parseInt(allData.equipment?.monthlyBudget || '0');
    const time = parseInt(allData.equipment?.weeklyTime || '0');
    const hasReel = allData.equipment?.mower?.includes('reel');
    const hasSprayer = allData.equipment?.sprayer && allData.equipment.sprayer !== 'none';
    const hasIssues = allData.status?.issues?.length > 1 || 
                      (allData.status?.issues?.length === 1 && !allData.status?.issues?.includes('none'));
    
    if (hasIssues && allData.status?.issues?.includes('disease')) {
      return 'recovery';
    }
    if (budget >= 300 && time >= 10 && hasReel && hasSprayer) {
      return 'domination';
    }
    if (budget >= 100 && time >= 5) {
      return 'balanced';
    }
    return 'weekend-warrior';
  };
  
  const program = getRecommendedProgram();
  
  const programs = {
    'weekend-warrior': {
      name: 'Weekend Warrior',
      description: 'Focus on the basics: mow, feed, and keep weeds out. Perfect for busy folks who want a decent lawn without the obsession.',
      immediate: [
        'Get a soil test from your extension office ($15-25)',
        'Buy pre-emergent for next application window',
        'Set mowing schedule (weekly in growing season)',
      ],
      monthly: [
        'Fertilize every 6-8 weeks (16-4-8 or similar)',
        'Spot spray weeds as needed',
        'Monitor for issues',
      ],
    },
    'balanced': {
      name: 'Lawn Enthusiast',
      description: 'You want that lawn that makes people slow down when they drive by. We\'ll use both granular and some liquid products.',
      immediate: [
        'Soil test if not done recently',
        'Start PGR program (Primo or generic)',
        'Get on a proper fertilization schedule',
      ],
      monthly: [
        'Spoon-feed nitrogen (0.25-0.5 lb N/month)',
        'PGR every 200-250 GDD',
        'Preventive fungicide if needed',
        'Micronutrients monthly',
      ],
    },
    'domination': {
      name: 'Domination Mode',
      description: 'Golf course or bust. You\'re ready for the full program with PGRs, foliar feeding, and precision applications.',
      immediate: [
        'Complete soil test with micronutrients',
        'Calculate exact PGR rates for your HOC',
        'Set up spray program calendar',
      ],
      monthly: [
        'Weekly foliar nitrogen (0.1-0.2 lb N)',
        'PGR every 150-200 GDD with Iron',
        'Preventive fungicide rotation',
        'Biostimulants and soil amendments',
        'Growth regulators for density',
      ],
    },
    'recovery': {
      name: 'Recovery Mode',
      description: 'Your lawn needs help first. Let\'s fix the problems, then we\'ll make it pretty.',
      immediate: [
        'Identify and treat disease immediately',
        'Core aeration if compacted',
        'Corrective fertilization based on deficiencies',
      ],
      monthly: [
        'Curative fungicide applications',
        'Rebuild soil health',
        'Gradual nitrogen to promote recovery',
        'Address underlying issues',
      ],
    },
  };
  
  const selected = programs[program as keyof typeof programs];
  
  // Generate immediate action items based on current issues
  const getImmediateActions = () => {
    const actions = [];
    const issues = allData.status?.issues || [];
    const month = new Date().getMonth() + 1;
    const state = allData.location?.state;
    
    if (issues.includes('weeds-pre')) {
      actions.push({
        priority: 'HIGH',
        action: 'Apply pre-emergent ASAP',
        product: 'Prodiamine or Dithiopyr',
        note: 'You may have missed the spring window, consider split app',
      });
    }
    
    if (issues.includes('disease')) {
      actions.push({
        priority: 'CRITICAL',
        action: 'Apply fungicide immediately',
        product: 'Azoxystrobin or Propiconazole',
        note: 'Rotate modes of action to prevent resistance',
      });
    }
    
    if (issues.includes('color')) {
      actions.push({
        priority: 'MEDIUM',
        action: 'Apply nitrogen + iron',
        product: '46-0-0 + FEature 6-0-0',
        note: 'Mix 0.25 lb N + 3 oz iron per 1000 sq ft',
      });
    }
    
    return actions;
  };
  
  const immediateActions = getImmediateActions();
  
  return (
    <Card className="bb-clay">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.Beaker /> Your Custom Program: {selected.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <BudSays>
            Based on everything you told me, here's your game plan. We'll start with the urgent stuff, then build your long-term program.
          </BudSays>
          
          <div className="bg-black/20 rounded-lg p-4">
            <h3 className="font-semibold mb-2">{selected.name}</h3>
            <p className="text-sm text-muted">{selected.description}</p>
          </div>
          
          {immediateActions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-red-400">🚨 Immediate Actions Required</h3>
              <div className="space-y-2">
                {immediateActions.map((action, idx) => (
                  <div key={idx} className="bg-red-900/20 rounded-lg p-3 border border-red-800">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-semibold">{action.action}</span>
                      <span className="text-xs px-2 py-0.5 bg-red-800 rounded">{action.priority}</span>
                    </div>
                    <div className="text-xs text-muted">Product: {action.product}</div>
                    <div className="text-xs mt-1">{action.note}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h3 className="font-semibold mb-3">This Week's Tasks</h3>
            <ul className="space-y-1">
              {selected.immediate.map((task, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-[#00ff00]">✓</span>
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Monthly Maintenance</h3>
            <ul className="space-y-1">
              {selected.monthly.map((task, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-muted">•</span>
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-800">
            <h4 className="font-semibold text-sm mb-2">Estimated Monthly Cost</h4>
            <div className="text-2xl font-bold">
              {program === 'weekend-warrior' && '$30-50'}
              {program === 'balanced' && '$75-150'}
              {program === 'domination' && '$200-400'}
              {program === 'recovery' && '$100-200'}
            </div>
            <div className="text-xs text-muted mt-1">Based on your lawn size and selected products</div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onBack}>Back</Button>
            <Button onClick={onNext} className="flex-1">Accept Program & Continue</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}