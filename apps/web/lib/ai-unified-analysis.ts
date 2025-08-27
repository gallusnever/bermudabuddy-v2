import { UnifiedYardState } from './unified-yard-state';
import { apiUrl } from './api';

export interface AIAnalysisResult {
  health: {
    score: number; // 0-100
    rating: 'critical' | 'poor' | 'fair' | 'good' | 'excellent';
    factors: string[];
  };
  program: {
    immediate: string[];
    thisWeek: string[];
    monthly: string[];
    seasonal: { [month: string]: string[] };
  };
  products: Array<{
    name: string;
    source: string;
    purpose: string;
    rate: string;
    frequency: string;
    cost: string;
    priority: number;
  }>;
  recommendations: string[];
  insights: string[];
  presidentialAddress: string;
}

export async function performComprehensiveAnalysis(state: UnifiedYardState): Promise<AIAnalysisResult> {
  try {
    // cache for 1 hour
    if ((state as any).aiAnalysis?.timestamp) {
      const cacheAge = Date.now() - new Date((state as any).aiAnalysis.timestamp).getTime();
      if (cacheAge < 3600000) return (state as any).aiAnalysis as AIAnalysisResult;
    }

    // Compose requests to backend AI endpoints
    const [analysisRes, programRes, addressRes] = await Promise.all([
      fetch(apiUrl('/api/ai/analyze'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: state }) }),
      fetch(apiUrl('/api/program'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: state }) }),
      fetch(apiUrl('/api/ai/address'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ analysis: (state as any).aiAnalysis || {}, weather: (state as any).weather || {}, issues: (state as any).issues || [] }) }),
    ]);

    const [analysis, program, address] = await Promise.all([analysisRes.json(), programRes.json(), addressRes.json()]);

    const result: AIAnalysisResult = validateAndCleanResponse({
      health: {
        score: analysis.overallHealth === 'excellent' ? 90 : analysis.overallHealth === 'good' ? 75 : analysis.overallHealth === 'fair' ? 60 : 40,
        rating: analysis.overallHealth,
        factors: analysis.keyMetrics || [],
      },
      program: {
        immediate: program.immediate || [],
        thisWeek: program.thisWeek || program.thisweek || [],
        monthly: program.monthly || [],
        seasonal: program.schedule || {},
      },
      products: program.products || [],
      recommendations: analysis.recommendations || [],
      insights: analysis.keyMetrics || [],
      presidentialAddress: address.text || generateDefaultAddress(),
    });
    return result;
  } catch (error) {
    console.error('Comprehensive analysis failed:', error);
    return generateFallbackAnalysis(state);
  }
}

// Comprehensive OpenRouter prompt removed; server-side analysis now used.

function getGrassDescription(type: string): string {
  const descriptions: { [key: string]: string } = {
    'tahoma31': 'Fine texture, drought tolerant, slower growth',
    'ironcutter': 'Extremely drought tolerant, deep blue-green',
    'tifway419': 'Dense, fine texture, high traffic tolerance',
    'celebration': 'Deep blue-green, shade tolerant',
    'latitude36': 'Cold hardy, fine texture',
    'northbridge': 'Cold tolerant, early green-up',
    'monaco': 'Dwarf variety, minimal mowing',
    'tifdwarf': 'Ultra dwarf, putting green quality',
    'common': 'Standard bermuda, aggressive growth',
    'yukon': 'Most cold hardy bermuda',
    'princess77': 'Seeded variety, quick establishment'
  };
  return descriptions[type] || 'Standard bermuda characteristics';
}

function validateAndCleanResponse(parsed: any): AIAnalysisResult {
  // Ensure all required fields exist with defaults
  return {
    health: parsed.health || {
      score: 70,
      rating: 'good',
      factors: []
    },
    program: parsed.program || {
      immediate: [],
      thisWeek: [],
      monthly: [],
      seasonal: {}
    },
    products: parsed.products || [],
    recommendations: parsed.recommendations || [],
    insights: parsed.insights || [],
    presidentialAddress: parsed.presidentialAddress || generateDefaultAddress()
  };
}

function generateDefaultAddress(): string {
  return `My fellow lawn enthusiasts,

Our bermuda brotherhood stands strong against the radical fescue left who would have us believe that shade tolerance matters more than drought resilience. They want open borders for crabgrass and dandelions. Not on our watch!

We shall continue our pursuit of lawn excellence through strategic fertilization, precise mowing, and unwavering dedication to the bermuda way of life.

The state of the Bermuda is strong.

God bless you, and God bless the United States of America.`;
}

function generateFallbackAnalysis(state: UnifiedYardState): AIAnalysisResult {
  const activeIssues = state.issues.filter(i => i.status !== 'resolved');
  const hasSprayer = state.equipment.sprayer.type !== 'none';
  const budget = state.resources.monthlyBudget;
  
  return {
    health: {
      score: Math.max(20, 100 - (activeIssues.length * 15)),
      rating: activeIssues.length > 3 ? 'poor' : activeIssues.length > 1 ? 'fair' : 'good',
      factors: activeIssues.map(i => `Active ${i.type} issue`)
    },
    program: {
      immediate: activeIssues.filter(i => i.severity === 'critical' || i.severity === 'high')
        .map(i => `Address ${i.type} immediately`),
      thisWeek: [
        'Mow at proper height',
        'Check irrigation coverage',
        'Scout for new issues'
      ],
      monthly: [
        'Apply fertilizer',
        'Monitor for pests',
        'Adjust mowing frequency'
      ],
      seasonal: generateSeasonalSchedule(state.yard.location.state)
    },
    products: generateProductRecommendations(hasSprayer, budget, activeIssues),
    recommendations: [
      state.soil.testDone ? 'Follow soil test recommendations' : 'Get a soil test ASAP',
      'Maintain consistent mowing schedule',
      'Monitor soil moisture'
    ],
    insights: [
      'Based on your location, pre-emergent window opens in 6 weeks',
      'Your mowing height is optimal for your grass type'
    ],
    presidentialAddress: generateDefaultAddress()
  };
}

function generateSeasonalSchedule(state: string): { [month: string]: string[] } {
  const isTransition = ['NC', 'SC', 'TN', 'AR', 'OK'].includes(state);
  const isDeepSouth = ['FL', 'LA', 'MS', 'AL', 'GA', 'TX'].includes(state);
  
  return {
    'January': isDeepSouth ? ['Dormant season planning', 'Equipment maintenance'] : ['Full dormancy'],
    'February': isDeepSouth ? ['Pre-emergent prep', 'Soil test'] : ['Still dormant'],
    'March': ['Pre-emergent application', 'Begin green-up prep'],
    'April': ['Spring fertilization', 'Begin mowing'],
    'May': ['Full growing season', 'Regular fertilization'],
    'June': ['Summer program', 'Disease prevention'],
    'July': ['Heat stress management', 'Deep watering'],
    'August': ['Continue summer program', 'Monitor for insects'],
    'September': ['Fall fertilization', 'Pre-emergent round 2'],
    'October': isDeepSouth ? ['Continue growth'] : ['Prepare for dormancy'],
    'November': ['Reduce nitrogen', 'Final mow'],
    'December': ['Dormant', 'Plan for next year']
  };
}

function generateProductRecommendations(hasSprayer: boolean, budget: number, issues: any[]): any[] {
  const products = [];
  
  if (hasSprayer && budget >= 200) {
    products.push({
      name: 'Primo Maxx',
      source: 'SiteOne',
      purpose: 'Growth regulator',
      rate: '0.175 oz/1000 ft²',
      frequency: 'Every 200 GDD',
      cost: '$120/quart',
      priority: 2
    });
  }
  
  if (issues.some(i => i.type === 'weeds-pre')) {
    products.push({
      name: hasSprayer ? 'Prodiamine 65 WDG' : 'Scotts Halts',
      source: hasSprayer ? 'DoMyOwn' : 'Lowes',
      purpose: 'Pre-emergent herbicide',
      rate: hasSprayer ? '0.37 oz/1000 ft²' : 'Per bag',
      frequency: 'Split app 8 weeks apart',
      cost: hasSprayer ? '$65' : '$45',
      priority: 1
    });
  }
  
  return products;
}
