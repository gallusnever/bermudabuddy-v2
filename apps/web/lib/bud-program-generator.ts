import { apiUrl } from './api';

export interface BudProgram {
  immediate: string[];
  thisWeek: string[];
  monthly: string[];
  products: ProductRecommendation[];
  schedule: MonthlySchedule;
}

interface ProductRecommendation {
  name: string;
  source: string; // Lowe's, Home Depot, SiteOne, DoMyOwn
  purpose: string;
  rate: string;
  frequency: string;
  cost: string;
}

interface MonthlySchedule {
  [month: string]: string[];
}

export async function generateBudProgram(data: any): Promise<BudProgram> {
  try {
    const res = await fetch(apiUrl('/api/program'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    if (!res.ok) throw new Error('Program API error');
    const prog = await res.json();
    // Ensure structure and provide fallbacks
    return {
      immediate: prog.immediate || [],
      thisWeek: prog.thisWeek || prog.thisweek || [],
      monthly: prog.monthly || [],
      products: prog.products || [],
      schedule: prog.schedule || {},
    } as BudProgram;
  } catch (error) {
    console.error('Program generation failed:', error);
    return generateFallbackProgram(data);
  }
}

function parseTextProgram(content: string, data: any): BudProgram {
  const lines = content.split('\n').filter(l => l.trim());
  const immediate: string[] = [];
  const thisWeek: string[] = [];
  const monthly: string[] = [];
  const products: ProductRecommendation[] = [];
  
  let currentSection = '';
  
  for (const line of lines) {
    if (line.toLowerCase().includes('immediate') || line.toLowerCase().includes('urgent')) {
      currentSection = 'immediate';
    } else if (line.toLowerCase().includes('this week') || line.toLowerCase().includes('weekly')) {
      currentSection = 'week';
    } else if (line.toLowerCase().includes('monthly') || line.toLowerCase().includes('schedule')) {
      currentSection = 'monthly';
    } else if (line.toLowerCase().includes('product')) {
      currentSection = 'products';
    } else if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
      const item = line.substring(1).trim();
      if (currentSection === 'immediate') immediate.push(item);
      else if (currentSection === 'week') thisWeek.push(item);
      else if (currentSection === 'monthly') monthly.push(item);
    }
  }
  
  return {
    immediate: immediate.length ? immediate : ['Get a soil test from your extension office'],
    thisWeek: thisWeek.length ? thisWeek : ['Measure and mark your property boundaries'],
    monthly: monthly.length ? monthly : ['Apply fertilizer according to soil test results'],
    products,
    schedule: generateMonthlySchedule(data)
  };
}

function generateFallbackProgram(data: any): BudProgram {
  const hasSprayer = data.equipment?.sprayer && data.equipment.sprayer !== 'none';
  const budget = parseInt(data.equipment?.monthlyBudget || '50');
  const area = data.location?.area || 5000;
  const areInThousands = area / 1000;
  
  const products: ProductRecommendation[] = [];
  const immediate: string[] = [];
  const thisWeek: string[] = [];
  const monthly: string[] = [];
  
  // Soil test is always first priority
  if (!data.equipment?.soilTestDone) {
    immediate.push('Get soil test from county extension office ($15-25)');
  }
  
  // Issue-specific immediate actions
  const issues = data.status?.issues || [];
  if (issues.includes('weeds-pre')) {
    immediate.push('Apply pre-emergent immediately (window may be closing)');
    products.push({
      name: hasSprayer ? 'Prodiamine 65 WDG' : 'Scotts Halts',
      source: hasSprayer ? 'DoMyOwn.com' : 'Lowe\'s',
      purpose: 'Pre-emergent herbicide',
      rate: hasSprayer ? '0.37 oz/1000 ft²' : 'Per bag instructions',
      frequency: 'Split app - now and 8 weeks',
      cost: hasSprayer ? '$65/5lb bag' : '$45/bag'
    });
  }
  
  if (issues.includes('disease')) {
    immediate.push('Apply fungicide ASAP - rotate active ingredients');
    products.push({
      name: hasSprayer ? 'Propiconazole 14.3' : 'Scotts DiseaseEx',
      source: hasSprayer ? 'DoMyOwn.com' : 'Home Depot',
      purpose: 'Fungicide',
      rate: hasSprayer ? '2 oz/1000 ft²' : 'Per bag instructions',
      frequency: 'Every 14-21 days while active',
      cost: hasSprayer ? '$35/pint' : '$20/bag'
    });
  }
  
  // Budget-based product recommendations
  if (budget >= 300 && hasSprayer) {
    // Domination mode
    products.push(
      {
        name: 'Primo Maxx or T-Nex',
        source: 'SiteOne or DoMyOwn',
        purpose: 'Growth regulator',
        rate: '0.175 oz/1000 ft²',
        frequency: 'Every 200 GDD',
        cost: '$120/quart'
      },
      {
        name: 'Feature 6-0-0 + Iron',
        source: 'SiteOne',
        purpose: 'Foliar nitrogen + iron',
        rate: '3-6 oz/1000 ft²',
        frequency: 'Weekly in season',
        cost: '$45/gallon'
      },
      {
        name: 'Humic DG',
        source: 'SiteOne',
        purpose: 'Soil amendment',
        rate: '3 lbs/1000 ft²',
        frequency: 'Monthly',
        cost: '$30/40lb bag'
      }
    );
    monthly.push(
      'Weekly foliar feeding (0.1-0.2 lb N/M)',
      'PGR application every 200 GDD',
      'Preventive fungicide rotation',
      'Micronutrient application'
    );
  } else if (budget >= 100) {
    // Balanced approach
    products.push(
      {
        name: hasSprayer ? 'Urea 46-0-0' : 'Scotts Turf Builder',
        source: hasSprayer ? 'SiteOne' : 'Lowe\'s',
        purpose: 'Nitrogen fertilizer',
        rate: hasSprayer ? '0.5 lb N/1000 ft²' : 'Per bag instructions',
        frequency: 'Monthly in growing season',
        cost: hasSprayer ? '$25/50lb' : '$45/bag'
      },
      {
        name: 'Milorganite',
        source: 'Home Depot',
        purpose: 'Organic fertilizer',
        rate: '16 lbs/1000 ft²',
        frequency: 'Every 6-8 weeks',
        cost: '$15/32lb bag'
      }
    );
    monthly.push(
      'Fertilize every 4-6 weeks (0.5-1 lb N/M)',
      'Spot spray weeds as needed',
      'Monitor for disease/insects'
    );
  } else {
    // Budget mode
    products.push(
      {
        name: 'Generic 16-4-8 fertilizer',
        source: 'Lowe\'s',
        purpose: 'Complete fertilizer',
        rate: 'Per bag instructions',
        frequency: 'Every 6-8 weeks',
        cost: '$20/bag'
      }
    );
    monthly.push(
      'Fertilize every 6-8 weeks',
      'Hand pull weeds',
      'Mow weekly at proper height'
    );
  }
  
  // Standard weekly tasks
  thisWeek.push(
    `Set mowing height to ${data.equipment?.hoc || '1.0'}"`,
    'Edge and trim for clean lines',
    'Check irrigation coverage'
  );
  
  return {
    immediate,
    thisWeek,
    monthly,
    products,
    schedule: generateMonthlySchedule(data)
  };
}

function generateMonthlySchedule(data: any): MonthlySchedule {
  const state = data.location?.state || 'TX';
  const isTransition = ['NC', 'SC', 'TN', 'AR', 'OK'].includes(state);
  const isDeepSouth = ['FL', 'LA', 'MS', 'AL', 'GA', 'TX'].includes(state);
  
  const schedule: MonthlySchedule = {
    'January': isDeepSouth ? ['Dormant - minimal activity', 'Plan for the year'] : ['Full dormancy'],
    'February': isDeepSouth ? ['Pre-emergent application window opens', 'Soil test'] : ['Still dormant'],
    'March': ['Pre-emergent application', 'Begin green-up preparation', isTransition ? 'Watch soil temps' : 'First mow possible'],
    'April': ['Spring green-up', 'Begin fertilization', 'Start PGR if applicable'],
    'May': ['Full growing season', 'Weekly mowing', 'Regular fertilization'],
    'June': ['Peak growth', 'Maintain PGR schedule', 'Watch for disease'],
    'July': ['Summer stress management', 'Deep watering', 'Monitor for insects'],
    'August': ['Continue summer program', 'Prepare for fall push', 'Consider aeration'],
    'September': ['Fall fertilization push', 'Pre-emergent round 2', 'Overseed if needed'],
    'October': isDeepSouth ? ['Continue growth', 'Reduce nitrogen'] : ['Prepare for dormancy'],
    'November': isTransition ? ['Final fertilization', 'Dormancy prep'] : ['Minimal activity'],
    'December': ['Dormant season', 'Equipment maintenance', 'Order products for next year']
  };
  
  return schedule;
}
