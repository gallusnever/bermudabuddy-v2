"use client";
import { useState, useEffect } from 'react';
import { Button, Input, Select, Badge, Icons } from '@bermuda/ui';
import { UnifiedYardState } from '../lib/unified-yard-state';
import { performComprehensiveAnalysis } from '../lib/ai-unified-analysis';
import { useYardState } from '../hooks/use-yard-state';
import { useAuth } from '../contexts/auth-context';

interface UpdateConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function UpdateConditionsModal({ isOpen, onClose, onUpdate }: UpdateConditionsModalProps) {
  const { user } = useAuth();
  const { state: currentYardState, updateState: updateYardState } = useYardState();
  const [state, setState] = useState<UnifiedYardState | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('yard');

  useEffect(() => {
    if (isOpen && currentYardState) {
      setState(JSON.parse(JSON.stringify(currentYardState))); // Deep clone
    }
  }, [isOpen, currentYardState]);

  if (!isOpen || !state) return null;

  const handleSave = async () => {
    if (!state) return;
    
    setLoading(true);
    try {
      // Update state with proper user context
      await updateYardState(state);
      
      // Trigger new AI analysis
      const analysis = await performComprehensiveAnalysis(state);
      await updateYardState({
        aiAnalysis: {
          ...analysis,
          timestamp: new Date().toISOString()
        }
      });
      
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update conditions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold">Update All Conditions</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            <Button
              variant={activeTab === 'yard' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('yard')}
            >
              Yard Info
            </Button>
            <Button
              variant={activeTab === 'equipment' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('equipment')}
            >
              Equipment
            </Button>
            <Button
              variant={activeTab === 'soil' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('soil')}
            >
              Soil Test
            </Button>
            <Button
              variant={activeTab === 'issues' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('issues')}
            >
              Issues
            </Button>
            <Button
              variant={activeTab === 'resources' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('resources')}
            >
              Resources
            </Button>
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {activeTab === 'yard' && (
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <Input
                      value={state.yard.location.city}
                      onChange={(e) => setState({
                        ...state,
                        yard: {
                          ...state.yard,
                          location: { ...state.yard.location, city: e.target.value }
                        }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">State</label>
                    <Input
                      value={state.yard.location.state}
                      onChange={(e) => setState({
                        ...state,
                        yard: {
                          ...state.yard,
                          location: { ...state.yard.location, state: e.target.value }
                        }
                      })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Total Area (sq ft)</label>
                    <Input
                      type="number"
                      value={state.yard.location.area}
                      onChange={(e) => setState({
                        ...state,
                        yard: {
                          ...state.yard,
                          location: { ...state.yard.location, area: parseInt(e.target.value) || 0 }
                        }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Grass Type</label>
                    <Select
                      value={state.yard.grass.type}
                      onChange={(e) => setState({
                        ...state,
                        yard: {
                          ...state.yard,
                          grass: { ...state.yard.grass, type: e.target.value }
                        }
                      })}
                    >
                      <option value="common">Common Bermuda</option>
                      <option value="tahoma31">Tahoma 31</option>
                      <option value="ironcutter">Iron Cutter</option>
                      <option value="tifway419">TifWay 419</option>
                      <option value="celebration">Celebration</option>
                      <option value="latitude36">Latitude 36</option>
                      <option value="northbridge">NorthBridge</option>
                      <option value="monaco">Monaco</option>
                      <option value="yukon">Yukon</option>
                      <option value="princess77">Princess 77</option>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'equipment' && (
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Mower Type</label>
                    <Select
                      value={state.equipment.mower.type}
                      onChange={(e) => setState({
                        ...state,
                        equipment: {
                          ...state.equipment,
                          mower: { ...state.equipment.mower, type: e.target.value }
                        }
                      })}
                    >
                      <option value="rotary">Rotary</option>
                      <option value="reel">Reel</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sprayer Type</label>
                    <Select
                      value={state.equipment.sprayer.type}
                      onChange={(e) => setState({
                        ...state,
                        equipment: {
                          ...state.equipment,
                          sprayer: { ...state.equipment.sprayer, type: e.target.value }
                        }
                      })}
                    >
                      <option value="none">None</option>
                      <option value="pump">Pump Sprayer</option>
                      <option value="backpack">Backpack</option>
                      <option value="battery">Battery Powered</option>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'soil' && (
              <div>
                <label className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={state.soil.testDone}
                    onChange={(e) => setState({
                      ...state,
                      soil: { ...state.soil, testDone: e.target.checked }
                    })}
                  />
                  <span className="font-medium">Soil Test Completed</span>
                </label>

                {state.soil.testDone && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">pH</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={state.soil.results?.ph || ''}
                        onChange={(e) => setState({
                          ...state,
                          soil: {
                            ...state.soil,
                            results: { 
                              ...state.soil.results!, 
                              ph: parseFloat(e.target.value) || 7 
                            }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Nitrogen</label>
                      <Select
                        value={state.soil.results?.nitrogen || ''}
                        onChange={(e) => setState({
                          ...state,
                          soil: {
                            ...state.soil,
                            results: { 
                              ...state.soil.results!, 
                              nitrogen: e.target.value 
                            }
                          }
                        })}
                      >
                        <option value="">Select...</option>
                        <option value="very-low">Very Low</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="very-high">Very High</option>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'issues' && (
              <div className="space-y-3">
                {state.issues.map((issue, i) => (
                  <div key={issue.id} className="border rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-3">
                      <Select
                        value={issue.type}
                        onChange={(e) => {
                          const issues = [...state.issues];
                          issues[i].type = e.target.value;
                          setState({ ...state, issues });
                        }}
                      >
                        <option value="weeds-pre">Weeds (Pre-emergent)</option>
                        <option value="weeds-post">Weeds (Post-emergent)</option>
                        <option value="disease">Disease</option>
                        <option value="insects">Insects</option>
                        <option value="thin">Thin/Bare Spots</option>
                        <option value="color">Color Issues</option>
                      </Select>
                      
                      <Select
                        value={issue.severity}
                        onChange={(e) => {
                          const issues = [...state.issues];
                          issues[i].severity = e.target.value as any;
                          setState({ ...state, issues });
                        }}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </Select>
                      
                      <Select
                        value={issue.status}
                        onChange={(e) => {
                          const issues = [...state.issues];
                          issues[i].status = e.target.value as any;
                          setState({ ...state, issues });
                        }}
                      >
                        <option value="identified">Identified</option>
                        <option value="treating">Treating</option>
                        <option value="monitoring">Monitoring</option>
                        <option value="resolved">Resolved</option>
                      </Select>
                    </div>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  onClick={() => {
                    const issues = [...state.issues, {
                      id: Math.random().toString(36),
                      type: 'weeds-pre',
                      severity: 'medium' as const,
                      status: 'identified' as const,
                      dateIdentified: new Date().toISOString()
                    }];
                    setState({ ...state, issues });
                  }}
                >
                  Add Issue
                </Button>
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Monthly Budget ($)</label>
                  <Input
                    type="number"
                    value={state.resources.monthlyBudget}
                    onChange={(e) => setState({
                      ...state,
                      resources: {
                        ...state.resources,
                        monthlyBudget: parseInt(e.target.value) || 0
                      }
                    })}
                  />
                  <p className="text-xs text-gray-500 mt-1">For products you buy, not app subscription</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Weekly Time (hours)</label>
                  <Input
                    type="number"
                    value={state.resources.weeklyTime}
                    onChange={(e) => setState({
                      ...state,
                      resources: {
                        ...state.resources,
                        weeklyTime: parseInt(e.target.value) || 0
                      }
                    })}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t flex justify-between">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Updating...' : 'Save & Analyze'}
          </Button>
        </div>
      </div>
    </div>
  );
}