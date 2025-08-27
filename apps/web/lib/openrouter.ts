import { apiUrl } from './api';

export interface YardAnalysis {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  keyMetrics: string[];
  activeIssues: string[];
  recommendations: string[];
}

export async function analyzeYardData(data: any): Promise<YardAnalysis> {
  try {
    const res = await fetch(apiUrl('/api/ai/analyze'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    if (!res.ok) throw new Error('Analyze API error');
    const out = await res.json();
    return out as YardAnalysis;
  } catch (error) {
    console.error('Analysis failed:', error);
    return { overallHealth: 'good', keyMetrics: [], activeIssues: [], recommendations: [] };
  }
}

export async function generatePresidentialAddress(
  analysis: YardAnalysis,
  weather: any,
  issues: any[]
): Promise<string> {
  try {
    const res = await fetch(apiUrl('/api/ai/address'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis, weather, issues })
    });
    if (!res.ok) throw new Error('Address API error');
    const out = await res.json();
    return out.text || generateFallbackAddress(analysis, issues);
  } catch (error) {
    console.error('Presidential address failed:', error);
    return generateFallbackAddress(analysis, issues);
  }
}

function parseRecommendations(content: string): string[] {
  // Extract recommendations from the AI response
  const recs: string[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.includes('recommend') || line.includes('should') || line.includes('apply')) {
      recs.push(line.trim());
    }
  }
  return recs.slice(0, 4); // Limit to 4 recommendations
}

function generateFallbackAddress(analysis: YardAnalysis, issues: any[]): string {
  const activeIssueCount = issues.filter(i => i.status !== 'resolved').length;
  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  
  let address = "My fellow lawn enthusiasts,\n\n";
  
  if (criticalIssues > 0) {
    address += "We face unprecedented challenges in our turf republic. ";
  } else if (activeIssueCount > 2) {
    address += "Our green nation stands at a crossroads. ";
  } else {
    address += "Our bermuda brotherhood continues to thrive. ";
  }
  
  address += `With ${activeIssueCount} active issues before us, we must act with resolve and purpose. `;
  
  if (issues.some(i => i.type === 'disease')) {
    address += "The fungal forces that threaten our sovereignty will be met with swift chemical justice. ";
  }
  
  if (issues.some(i => i.type.includes('weeds'))) {
    address += "We shall defend our borders against the weed invasion with pre-emergent fortifications. ";
  }
  
  address += "\n\nTogether, we shall overcome. Together, we shall dominate.\n\n";
  address += "The state of the Bermuda is strong.";
  
  return address;
}
