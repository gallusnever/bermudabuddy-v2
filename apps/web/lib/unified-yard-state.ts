import { supabase } from './supabase';

// Comprehensive yard state stored in Supabase
export interface UnifiedYardState {
  id?: string;
  user_id: string;
  
  // Core yard info
  yard: {
    location: {
      city: string;
      state: string;
      zip?: string;
      coords?: { lat: number; lon: number };
      area: number; // total sq ft
    };
    grass: {
      type: string; // tahoma31, ironcutter, etc
      hoc: number;
      age?: number; // years
    };
    zones: Array<{
      id: string;
      name: string;
      area: number;
      grassType?: string; // if different from main
      photos?: string[]; // URLs
      issues?: string[]; // zone-specific issues
    }>;
  };
  
  // Equipment inventory
  equipment: {
    mower: {
      type: string; // rotary, reel
      brand?: string;
      model?: string;
    };
    sprayer: {
      type: string; // none, pump, backpack, battery
      capacity?: number; // gallons
      model?: string;
    };
    spreader: {
      type: string;
      model?: string;
    };
    irrigation: {
      type: string;
      zones?: number;
    };
  };
  
  // Soil and testing
  soil: {
    testDone: boolean;
    testDate?: string;
    results?: {
      nitrogen: string;
      phosphorus: number;
      potassium: number;
      ph: number;
      organic: number;
    };
  };
  
  // Budget and resources
  resources: {
    monthlyBudget: number; // dollars for products
    weeklyTime: number; // hours
    diyLevel: 'beginner' | 'intermediate' | 'advanced';
  };
  
  // Current issues tracking
  issues: Array<{
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'identified' | 'treating' | 'monitoring' | 'resolved';
    zone?: string;
    dateIdentified: string;
    dateResolved?: string;
    treatment?: string;
    notes?: string;
    photos?: string[];
  }>;
  
  // Weather cache
  weather?: {
    current: {
      soilTemp: number;
      airTemp: number;
      humidity: number;
      windSpeed: number;
    };
    forecast: any[];
    lastUpdated: string;
  };
  
  // AI Analysis results (cached)
  aiAnalysis?: {
    timestamp: string;
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
    insights: string[]; // predictive insights
    presidentialAddress?: string; // Keep separate for silly content
  };
  
  // Metadata
  created_at?: string;
  updated_at?: string;
}

// Main class to manage unified state
export class YardStateManager {
  private static instance: YardStateManager;
  private currentState: UnifiedYardState | null = null;
  private userId: string | null = null;
  
  static getInstance(): YardStateManager {
    if (!YardStateManager.instance) {
      YardStateManager.instance = new YardStateManager();
    }
    return YardStateManager.instance;
  }
  
  async initialize(userId: string) {
    this.userId = userId;
    await this.load();
  }
  
  // Load state from Supabase or localStorage fallback
  async load(): Promise<UnifiedYardState | null> {
    try {
      if (this.userId) {
        // Try Supabase first
        const { data, error } = await supabase
          .from('yard_states')
          .select('*')
          .eq('user_id', this.userId)
          .single();
        
        if (data && !error) {
          this.currentState = data;
          return data;
        }
      }
      
      // Fallback to localStorage migration
      const migrated = this.migrateFromLocalStorage();
      if (migrated) {
        this.currentState = migrated;
        // Save to Supabase if we have a user
        if (this.userId) {
          await this.save(migrated);
        }
      }
      return migrated;
    } catch (error) {
      console.error('Failed to load yard state:', error);
      return this.migrateFromLocalStorage();
    }
  }
  
  // Save unified state to Supabase
  async save(state?: UnifiedYardState): Promise<boolean> {
    const stateToSave = state || this.currentState;
    if (!stateToSave || !this.userId) return false;
    
    try {
      const { error } = await supabase
        .from('yard_states')
        .upsert({
          ...stateToSave,
          user_id: this.userId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.userId);
      
      if (error) throw error;
      
      // Also save to localStorage for offline access
      localStorage.setItem('bb_unified_state', JSON.stringify(stateToSave));
      
      return true;
    } catch (error) {
      console.error('Failed to save yard state:', error);
      // At least save to localStorage
      localStorage.setItem('bb_unified_state', JSON.stringify(stateToSave));
      return false;
    }
  }
  
  // Update partial state
  async update(updates: Partial<UnifiedYardState>): Promise<boolean> {
    if (!this.currentState) {
      this.currentState = updates as UnifiedYardState;
    } else {
      this.currentState = this.deepMerge(this.currentState, updates);
    }
    return await this.save();
  }
  
  // Get current state
  getState(): UnifiedYardState | null {
    return this.currentState;
  }
  
  // Migrate from old localStorage structure
  private migrateFromLocalStorage(): UnifiedYardState | null {
    try {
      const onboarding = localStorage.getItem('bb_onboarding');
      const issues = localStorage.getItem('bb_yard_issues');
      const sections = localStorage.getItem('bb_yard_sections');
      const program = localStorage.getItem('bb_program');
      
      if (!onboarding) return null;
      
      const onboardData = JSON.parse(onboarding);
      const issuesData = issues ? JSON.parse(issues) : [];
      const sectionsData = sections ? JSON.parse(sections) : [];
      const programData = program ? JSON.parse(program) : null;
      
      const migrated: UnifiedYardState = {
        user_id: 'local', // Will be updated when user logs in
        yard: {
          location: {
            city: onboardData.location?.city || '',
            state: onboardData.location?.state || '',
            zip: onboardData.location?.zip,
            area: onboardData.location?.area || 0,
            coords: onboardData.location?.lat && onboardData.location?.lon
              ? { lat: onboardData.location.lat, lon: onboardData.location.lon }
              : undefined,
          },
          grass: {
            type: onboardData.grass?.type || onboardData.equipment?.grassType || 'common',
            hoc: parseFloat(onboardData.grass?.hoc ?? onboardData.equipment?.hoc ?? '1.0'),
            age: onboardData.grass?.age ?? onboardData.equipment?.lawnAge
          },
          zones: (sectionsData ?? onboardData.zones ?? []).map((s: any) => ({
            id: s.id,
            name: s.name,
            area: s.area || 0,
            photos: s.photos || []
          }))
        },
        equipment: {
          mower: {
            type: onboardData.equipment?.mower?.includes('reel') ? 'reel' : 'rotary',
            model: onboardData.equipment?.mower
          },
          sprayer: {
            type: onboardData.equipment?.sprayer || 'none',
            model: onboardData.equipment?.sprayer
          },
          spreader: {
            type: onboardData.equipment?.spreader || 'broadcast',
            model: onboardData.equipment?.spreader
          },
          irrigation: {
            type: onboardData.equipment?.irrigation || 'hose'
          }
        },
        soil: {
          testDone: onboardData.equipment?.soilTestDone || false,
          results: onboardData.equipment?.soilTestResults
        },
        resources: {
          monthlyBudget: parseInt(onboardData.equipment?.monthlyBudget || '50'),
          weeklyTime: parseInt(onboardData.equipment?.weeklyTime || '2'),
          diyLevel: onboardData.equipment?.experience || 'beginner'
        },
        issues: Array.isArray(issuesData) ? issuesData : (onboardData.status?.issues ?? []),
        aiAnalysis: programData ? {
          timestamp: new Date().toISOString(),
          health: {
            score: 70,
            rating: 'good',
            factors: []
          },
          program: programData,
          products: programData.products || [],
          recommendations: [],
          insights: []
        } : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return migrated;
    } catch (error) {
      console.error('Migration failed:', error);
      return null;
    }
  }
  
  // Deep merge helper
  private deepMerge(target: any, source: any): any {
    // Handle arrays specially
    if (Array.isArray(target) && Array.isArray(source)) {
      // If arrays contain objects with ids, merge by id
      if (target.every((x: any) => x?.id) && source.every((x: any) => x?.id)) {
        const byId = new Map(target.map((x: any) => [x.id, x]));
        for (const s of source) {
          byId.set(s.id, this.deepMerge(byId.get(s.id) ?? {}, s));
        }
        return Array.from(byId.values());
      }
      // Otherwise replace the array
      return source;
    }
    
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target))
            Object.assign(output, { [key]: source[key] });
          else
            output[key] = this.deepMerge(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Export singleton instance
export const yardState = YardStateManager.getInstance();