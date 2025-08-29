import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let _client: SupabaseClient | null = null;

export function getSupabase() {
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      }
    });
  }
  return _client;
}

// Back-compat default export used across the app:
export const supabase = getSupabase();

// Types for our database
export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  latitude?: number;  // Alias for compatibility
  longitude?: number; // Alias for compatibility
  area_sqft?: number;
  grass_type?: string;
  hoc?: number;
  mower?: string;
  sprayer?: string;
  irrigation?: string;
  program?: string;
  user_level?: string;
  product_source?: string;
  application_method?: string;
  lawn_issues?: string[];
  disclaimer_accepted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LawnZone {
  id: string;
  user_id: string;
  name: string;
  geojson?: any;
  area_sqft?: number;
  created_at?: string;
}

export interface Application {
  id: string;
  user_id: string;
  zone_id?: string;
  product_id: string;
  date: string;
  rate_value: number;
  rate_unit: string;
  area_sqft: number;
  batch_id?: string;
  notes?: string;
  created_at?: string;
}