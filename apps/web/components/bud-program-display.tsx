"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Icons } from '@bermuda/ui';
import { generateBudProgram, BudProgram } from '../lib/bud-program-generator';
import BudSays from './bud-says';

export function BudProgramDisplay() {
  const [program, setProgram] = useState<BudProgram | null>(null);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    const saved = localStorage.getItem('bb_onboarding');
    if (saved) {
      const data = JSON.parse(saved);
      setUserData(data);
      generateProgram(data);
    }
  };

  const generateProgram = async (data: any) => {
    if (!data) return;
    
    setLoading(true);
    try {
      // Get current issues from localStorage
      const savedIssues = localStorage.getItem('bb_yard_issues');
      const issues = savedIssues ? JSON.parse(savedIssues) : [];
      
      // Get weather data
      const weatherResponse = await fetch('/api/weather/summary?lat=32.78&lon=-96.80&hours=24');
      const weather = await weatherResponse.json();
      
      // Pass complete data to program generator
      const fullData = {
        ...data,
        issues: issues.map((i: any) => ({
          type: i.type,
          severity: i.severity,
          status: i.status,
          zone: i.zone,
          notes: i.notes
        })),
        weather: {
          current_soil_temp: weather?.current?.soil_temp_f,
          forecast: weather?.forecast
        }
      };
      
      const result = await generateBudProgram(fullData);
      setProgram(result);
      
      // Save program to localStorage
      localStorage.setItem('bb_program', JSON.stringify(result));
    } catch (error) {
      console.error('Failed to generate program:', error);
    } finally {
      setLoading(false);
    }
  };

  const regenerateProgram = () => {
    if (userData) {
      generateProgram(userData);
    }
  };

  if (!program && !loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.Calendar className="h-5 w-5" />
            Bud's Personalized Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">Complete your onboarding to get a personalized lawn care program.</p>
          <Button onClick={() => window.location.href = '/onboarding'}>
            Start Onboarding
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.Calendar className="h-5 w-5" />
            Bud's Personalized Program
          </div>
          <Button size="sm" variant="outline" onClick={regenerateProgram} disabled={loading}>
            {loading ? <Icons.Spinner className="h-4 w-4 animate-spin" /> : <Icons.RefreshCw className="h-4 w-4" />}
            Regenerate
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Icons.Spinner className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : program ? (
          <>
            {/* Immediate Actions */}
            {program.immediate.length > 0 && (
              <div>
                <h3 className="font-semibold text-red-600 mb-2 flex items-center gap-1">
                  <Icons.AlertTriangle className="h-4 w-4" />
                  Immediate Actions Required
                </h3>
                <ul className="space-y-1">
                  {program.immediate.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* This Week's Tasks */}
            {program.thisWeek.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-1">
                  <Icons.Calendar className="h-4 w-4" />
                  This Week's Tasks
                </h3>
                <ul className="space-y-1">
                  {program.thisWeek.map((task, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Monthly Routine */}
            {program.monthly.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-1">
                  <Icons.Clock className="h-4 w-4" />
                  Monthly Routine
                </h3>
                <ul className="space-y-1">
                  {program.monthly.map((task, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Product Recommendations */}
            {program.products.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-1">
                  <Icons.ShoppingCart className="h-4 w-4" />
                  Product Recommendations
                </h3>
                <div className="space-y-2">
                  {program.products.slice(0, showDetails ? undefined : 3).map((product, i) => (
                    <div key={i} className="border rounded-lg p-3 text-sm">
                      <div className="font-medium flex items-center justify-between">
                        {product.name}
                        <Badge variant="outline" size="sm">{product.cost}</Badge>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        <div>Source: {product.source}</div>
                        <div>Purpose: {product.purpose}</div>
                        <div>Rate: {product.rate}</div>
                        <div>Frequency: {product.frequency}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {program.products.length > 3 && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setShowDetails(!showDetails)}
                    className="mt-2"
                  >
                    {showDetails ? 'Show Less' : `Show ${program.products.length - 3} More Products`}
                  </Button>
                )}
              </div>
            )}

            {/* Monthly Schedule Preview */}
            {program.schedule && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-1">
                  <Icons.MapPin className="h-4 w-4" />
                  This Month's Focus
                </h3>
                <div className="text-sm text-gray-600">
                  {program.schedule[new Date().toLocaleDateString('en-US', { month: 'long' })]?.map((task, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span>{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}

        <div className="pt-4 border-t">
          <BudSays 
            message={`Your personalized program is based on your ${userData?.equipment?.grassType || 'bermuda'} grass, ${userData?.equipment?.sprayer !== 'none' ? 'liquid application capability' : 'granular spreader'}, and $${userData?.equipment?.monthlyBudget || 50}/month budget.`}
            variant="info"
            compact
          />
        </div>
      </CardContent>
    </Card>
  );
}