"use client";
import { useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Badge, Icons } from '@bermuda/ui';
import BudSays from '../../components/bud-says';
import { apiUrl } from '../../lib/api';
import { useAuth } from '../../contexts/auth-context';
import { analyzeYardData, generatePresidentialAddress } from '../../lib/openrouter';
import Image from 'next/image';

interface Issue {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'identified' | 'treating' | 'monitoring' | 'resolved';
  dateIdentified: string;
  dateResolved?: string;
  treatment?: string;
  notes?: string;
  zone?: string;
}

interface YardData {
  location?: any;
  equipment?: any;
  status?: any;
  program?: string;
  grassType?: string;
  area?: number;
  zones?: any[];
  soilTest?: any;
}

export default function YardStatePage() {
  const { user } = useAuth();
  const [yardData, setYardData] = useState<YardData>({});
  const [issues, setIssues] = useState<Issue[]>([]);
  const [weather, setWeather] = useState<any>(null);
  const [newIssue, setNewIssue] = useState({
    type: '',
    severity: 'medium' as Issue['severity'],
    zone: '',
    notes: ''
  });
  const [showNewIssue, setShowNewIssue] = useState(false);
  const [presidentialAddress, setPresidentialAddress] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadYardData();
    loadWeatherData();
    loadIssues();
  }, []);

  useEffect(() => {
    if (yardData.location && weather && !loading) {
      generateAddress();
    }
  }, [yardData, weather, issues, loading]);

  const loadYardData = () => {
    try {
      const saved = localStorage.getItem('bb_onboarding');
      if (saved) {
        const data = JSON.parse(saved);
        setYardData(data);
      }
    } catch (err) {
      console.error('Failed to load yard data:', err);
    }
  };

  const loadWeatherData = async () => {
    try {
      const response = await fetch(apiUrl('/api/weather/summary?lat=32.78&lon=-96.80&hours=24'));
      const data = await response.json();
      setWeather(data);
    } catch (err) {
      console.error('Failed to load weather:', err);
    }
  };

  const loadIssues = () => {
    try {
      const saved = localStorage.getItem('bb_yard_issues');
      if (saved) {
        setIssues(JSON.parse(saved));
      } else {
        // Initialize with issues from onboarding
        const onboarding = localStorage.getItem('bb_onboarding');
        if (onboarding) {
          const data = JSON.parse(onboarding);
          if (data.status?.issues && data.status.issues.length > 0) {
            const initialIssues = data.status.issues
              .filter((i: string) => i !== 'none')
              .map((issueType: string) => ({
                id: Math.random().toString(36),
                type: issueType,
                severity: issueType === 'disease' ? 'high' : 'medium',
                status: 'identified' as Issue['status'],
                dateIdentified: new Date().toISOString()
              }));
            setIssues(initialIssues);
            localStorage.setItem('bb_yard_issues', JSON.stringify(initialIssues));
          }
        }
      }
    } catch (err) {
      console.error('Failed to load issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAddress = async () => {
    try {
      // Pass complete user data to OpenRouter for sophisticated analysis
      const fullData = {
        ...yardData,
        issues: issues.map(i => ({
          type: i.type,
          severity: i.severity,
          status: i.status,
          zone: i.zone,
          notes: i.notes,
          dateIdentified: i.dateIdentified
        })),
        weather: weather,
        userId: user?.id
      };
      
      const analysis = await analyzeYardData(fullData);
      const address = await generatePresidentialAddress(analysis, weather, issues);
      setPresidentialAddress(address);
    } catch (error) {
      console.error('OpenRouter failed, using local generation:', error);
      // Fallback to local generation
      generateLocalAddress();
    }
  };

  const generateLocalAddress = () => {
    const { location, equipment } = yardData;
    const activeIssues = issues.filter(i => i.status !== 'resolved');
    const criticalCount = activeIssues.filter(i => i.severity === 'critical').length;
    const highCount = activeIssues.filter(i => i.severity === 'high').length;
    const currentTemp = weather?.current?.soil_temp_f;
    
    let address = `My fellow lawn enthusiasts,\n\n`;
    
    address += `From the great state of ${location?.state || 'Texas'}, I come before you today to deliver this critical report on the state of our turf union.\n\n`;
    
    // Overall assessment
    if (criticalCount > 0) {
      address += `We face a moment of great peril. ${criticalCount} critical threat${criticalCount > 1 ? 's' : ''} endangers the very foundation of our bermuda sovereignty. `;
    } else if (highCount > 0) {
      address += `While our lawn remains resilient, we cannot ignore the ${highCount} high-priority challenge${highCount > 1 ? 's' : ''} that tests our resolve. `;
    } else if (activeIssues.length > 2) {
      address += `Our green republic stands strong, yet ${activeIssues.length} issues demand our attention and swift action. `;
    } else if (activeIssues.length > 0) {
      address += `The fundamental strength of our turf remains intact, though vigilance is required to address emerging challenges. `;
    } else {
      address += `Today, I am proud to report that our bermuda brotherhood has achieved a state of excellence unmatched in the neighborhood. `;
    }
    
    // Temperature assessment
    if (currentTemp) {
      if (currentTemp < 65) {
        address += `\n\nAs soil temperatures fall to ${Math.round(currentTemp)}°F, we enter the dormant season - not a retreat, but a strategic consolidation of our roots. `;
      } else if (currentTemp > 85) {
        address += `\n\nWith soil temperatures at an optimal ${Math.round(currentTemp)}°F, we are in the golden age of growth. This is our time to shine! `;
      } else {
        address += `\n\nAt ${Math.round(currentTemp)}°F, our soil temperature supports steady progress toward our goals. `;
      }
    }
    
    // Equipment assessment
    if (equipment?.mower?.includes('reel')) {
      address += `Armed with precision reel mowing technology, we cut with surgical accuracy. `;
    }
    if (equipment?.sprayer && equipment.sprayer !== 'none') {
      address += `Our liquid application capabilities ensure targeted deployment of essential nutrients and protectants. `;
    }
    if (equipment?.hoc && parseFloat(equipment.hoc) <= 0.75) {
      address += `Maintaining a height of cut at ${equipment.hoc} inches demonstrates our commitment to excellence. `;
    }
    
    // Issue-specific rhetoric
    if (activeIssues.some(i => i.type === 'disease')) {
      address += `\n\nTo the fungal forces that dare threaten our turf: Your days are numbered. We shall deploy our arsenal of fungicides with precision and rotate our active ingredients to prevent resistance. `;
    }
    
    if (activeIssues.some(i => i.type === 'weeds-pre')) {
      address += `\n\nThe weed seeds lying dormant in our soil shall never see the light of day. Our pre-emergent barrier stands ready to defend every square inch. `;
    }
    
    if (activeIssues.some(i => i.type === 'weeds-post')) {
      address += `\n\nTo the weeds that have breached our defenses: You will be met with selective herbicides that spare no invader. `;
    }
    
    if (activeIssues.some(i => i.type === 'thin')) {
      address += `\n\nWhere our coverage has thinned, we shall overseed and nurture new growth. Every bare spot is an opportunity for renewal. `;
    }
    
    // Partisan jabs at fescue
    address += `\n\nTo the radical fescue left who claim their shade tolerance makes them superior: We see through your propaganda. `;
    address += `You want us to believe that bermuda can't thrive, that we should surrender our lawns to your weak-rooted ideology. `;
    address += `But the fescue establishment, with their cool-season elitism, will never understand the heart of real grass-roots Americans.`;
    
    if (activeIssues.length > 0) {
      address += ` They want open borders for crabgrass, unrestricted immigration of dandelions. Not on my watch!`;
    }
    
    // Closing
    address += `\n\nMy fellow lawn enthusiasts, the path ahead is clear. With proper nutrition, vigilant pest management, and unwavering dedication, we shall achieve the lawn of our dreams.\n\n`;
    address += `Together, we mow forward. Together, we grow stronger.\n\n`;
    address += `**The state of the Bermuda is strong.**\n\n`;
    address += `God bless you, and God bless the United States of America.`;
    
    setPresidentialAddress(address);
  };

  const addIssue = () => {
    if (!newIssue.type) return;
    
    const issue: Issue = {
      id: Math.random().toString(36),
      type: newIssue.type,
      severity: newIssue.severity,
      status: 'identified',
      dateIdentified: new Date().toISOString(),
      zone: newIssue.zone,
      notes: newIssue.notes
    };
    
    const updated = [...issues, issue];
    setIssues(updated);
    localStorage.setItem('bb_yard_issues', JSON.stringify(updated));
    
    setNewIssue({ type: '', severity: 'medium', zone: '', notes: '' });
    setShowNewIssue(false);
    
    // Regenerate address with new issue
    generateAddress();
  };

  const updateIssueStatus = (id: string, status: Issue['status']) => {
    const updated = issues.map(issue => {
      if (issue.id === id) {
        return {
          ...issue,
          status,
          dateResolved: status === 'resolved' ? new Date().toISOString() : undefined
        };
      }
      return issue;
    });
    setIssues(updated);
    localStorage.setItem('bb_yard_issues', JSON.stringify(updated));
    
    // Regenerate address with updated status
    generateAddress();
  };

  const deleteIssue = (id: string) => {
    const updated = issues.filter(i => i.id !== id);
    setIssues(updated);
    localStorage.setItem('bb_yard_issues', JSON.stringify(updated));
    
    // Regenerate address after deletion
    generateAddress();
  };

  const getSeverityColor = (severity: Issue['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 border-red-500 text-red-400';
      case 'high': return 'bg-orange-500/20 border-orange-500 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
      case 'low': return 'bg-green-500/20 border-green-500 text-green-400';
    }
  };

  const getStatusColor = (status: Issue['status']) => {
    switch (status) {
      case 'identified': return 'bg-red-500/20 text-red-400';
      case 'treating': return 'bg-blue-500/20 text-blue-400';
      case 'monitoring': return 'bg-yellow-500/20 text-yellow-400';
      case 'resolved': return 'bg-green-500/20 text-green-400';
    }
  };

  return (
    <main className="container mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">State of the Yard</h1>
        <p className="text-sm text-muted">Presidential address and issue tracking</p>
      </div>

      {/* President Bud's State of the Bermuda Address */}
      <Card className="mb-6 bb-clay">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.LawnLeaf /> Transcript of Bud's Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <img 
                src="/presidentbud.jpg" 
                alt="President Bud" 
                width={200} 
                height={250}
                className="rounded-lg shadow-xl"
                style={{ objectFit: 'cover', width: '200px', height: '250px' }}
              />
              <div className="text-center mt-2 text-xs text-muted italic">
                President Bud
                <br />
                Commander in Leaf
              </div>
            </div>
            <div className="flex-1">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {presidentialAddress || 'Preparing address...'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issue Tracking System */}
      <Card className="mb-6 bb-clay">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Icons.AlertTriangle /> Issue Tracker
            </CardTitle>
            <Button 
              size="sm"
              onClick={() => setShowNewIssue(!showNewIssue)}
            >
              + Log Issue
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showNewIssue && (
            <div className="mb-6 p-4 bb-card rounded-lg space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs mb-1">Issue Type</label>
                  <Select 
                    value={newIssue.type} 
                    onChange={(e) => setNewIssue(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="">Select issue...</option>
                    <option value="weeds-pre">Weeds (need pre-emergent)</option>
                    <option value="weeds-post">Weeds (existing)</option>
                    <option value="disease">Disease/Fungus</option>
                    <option value="insects">Insects/Pests</option>
                    <option value="thin">Thin/Bare spots</option>
                    <option value="color">Color issues</option>
                    <option value="thatch">Thatch buildup</option>
                    <option value="compaction">Soil compaction</option>
                    <option value="drainage">Drainage problems</option>
                    <option value="scalping">Scalping damage</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs mb-1">Severity</label>
                  <Select 
                    value={newIssue.severity} 
                    onChange={(e) => setNewIssue(prev => ({ ...prev, severity: e.target.value as Issue['severity'] }))}
                  >
                    <option value="low">Low - Cosmetic</option>
                    <option value="medium">Medium - Needs attention</option>
                    <option value="high">High - Spreading/worsening</option>
                    <option value="critical">Critical - Lawn at risk</option>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1">Notes</label>
                <Input
                  placeholder="Additional details..."
                  value={newIssue.notes}
                  onChange={(e) => setNewIssue(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addIssue}>Add Issue</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowNewIssue(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Issue Flow Chart */}
          <div className="space-y-2">
            {['identified', 'treating', 'monitoring', 'resolved'].map(status => {
              const statusIssues = issues.filter(i => i.status === status);
              if (statusIssues.length === 0 && status !== 'identified') return null;
              
              return (
                <div key={status} className="bb-card p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getStatusColor(status as Issue['status'])}>
                      {status.toUpperCase()} ({statusIssues.length})
                    </Badge>
                  </div>
                  
                  {statusIssues.length === 0 ? (
                    <div className="text-xs text-muted pl-6">No issues</div>
                  ) : (
                    <div className="space-y-2 pl-6">
                      {statusIssues.map(issue => (
                        <div key={issue.id} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <Badge className={getSeverityColor(issue.severity) + ' text-xs'}>
                              {issue.severity}
                            </Badge>
                            <span className="text-sm font-medium">
                              {issue.type.replace(/-/g, ' ').charAt(0).toUpperCase() + issue.type.replace(/-/g, ' ').slice(1)}
                            </span>
                            {issue.notes && (
                              <span className="text-xs text-muted">- {issue.notes}</span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {status !== 'resolved' && (
                              <Select
                                className="text-xs h-7"
                                value={status}
                                onChange={(e) => updateIssueStatus(issue.id, e.target.value as Issue['status'])}
                              >
                                <option value="identified">Identified</option>
                                <option value="treating">Treating</option>
                                <option value="monitoring">Monitoring</option>
                                <option value="resolved">Resolved</option>
                              </Select>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => deleteIssue(issue.id)}
                              className="h-7 px-2"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bb-clay">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="ghost" onClick={() => window.location.href = '/mix'}>
              View PGR Schedule
            </Button>
            <Button variant="ghost" onClick={() => window.location.href = '/mix'}>
              Calculate Mix Rates
            </Button>
            <Button variant="ghost" onClick={() => window.location.href = '/applications'}>
              Log Application
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}