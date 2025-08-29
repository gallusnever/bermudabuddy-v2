'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<any>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    let mounted = true;

    // Initial session hydrate
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      console.debug('[Auth] Initial session check:', session ? 'found' : 'none', 'at', new Date().toISOString());
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      console.debug('[Auth] event:', event, 'at', new Date().toISOString());
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    // Ensure refresh timer runs even on background tabs
    supabase.auth.startAutoRefresh();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  async function checkUser() {
    try {
      console.log('[Auth] Checking for existing session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[Auth] Error getting session:', error);
      } else if (session?.user) {
        console.log('[Auth] Found existing session for user:', session.user.id);
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        console.log('[Auth] No existing session found');
        setUser(null);
      }
    } catch (error) {
      console.error('[Auth] Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProfile(userId: string) {
    try {
      console.log('[Auth] Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(); // Use single() to get explicit error if no profile
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found - retry once after delay
          console.log('[Auth] No profile found, retrying in 1s...');
          await new Promise(r => setTimeout(r, 1000));
          
          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (retryError) {
            console.error('[Auth] Profile still not found after retry:', retryError);
            setProfile(null);
            return;
          }
          
          if (retryData) {
            console.log('[Auth] Profile loaded on retry:', retryData);
            setProfile(retryData);
          }
        } else {
          console.error('[Auth] Profile fetch error:', error);
          setProfile(null);
          return;
        }
      } else if (data) {
        console.log('[Auth] Profile loaded:', data);
        setProfile(data);
        // Merge profile into local onboarding cache without nuking existing keys
        try {
          const existing = JSON.parse(localStorage.getItem('bb_onboarding') || '{}');
          const merged = {
            ...existing,
            account: {
              ...(existing.account || {}),
              nickname: data.nickname || existing?.account?.nickname || 'LawnWarrior',
              email: data.email || existing?.account?.email,
              firstName: data.first_name || existing?.account?.firstName,
              lastName: data.last_name || existing?.account?.lastName,
            },
            location: {
              ...(existing.location || {}),
              address: (data as any).address || existing?.location?.address,
              city: (data as any).city || existing?.location?.city,
              state: (data as any).state || existing?.location?.state,
              zip: (data as any).zip || existing?.location?.zip,
              area: (data as any).area_sqft ?? existing?.location?.area,
            },
            equipment: {
              ...(existing.equipment || {}),
              hoc: (data as any).hoc ?? existing?.equipment?.hoc,
              mower: (data as any).mower || existing?.equipment?.mower,
              irrigation: (data as any).irrigation || existing?.equipment?.irrigation,
              sprayer: (data as any).sprayer || existing?.equipment?.sprayer,
            },
            grass: {
              ...(existing.grass || {}),
              type: (data as any).grass_type || existing?.grass?.type,
            },
          };
          localStorage.setItem('bb_onboarding', JSON.stringify(merged));
          if (data.nickname) {
            try { localStorage.setItem('bb_onboarding_complete', 'true'); } catch {}
            try { document.cookie = `bb_onboarding_complete=true; Path=/; Max-Age=31536000`; } catch {}
          }
        } catch (e) {
          // Fallback to minimal write
          const onboardingData = {
            account: { nickname: data.nickname || 'LawnWarrior', email: data.email, firstName: (data as any).first_name, lastName: (data as any).last_name },
            location: { address: (data as any).address, city: (data as any).city, state: (data as any).state, zip: (data as any).zip, area: (data as any).area_sqft },
            equipment: { hoc: (data as any).hoc, mower: (data as any).mower, irrigation: (data as any).irrigation, sprayer: (data as any).sprayer },
            grass: { type: (data as any).grass_type },
          };
          localStorage.setItem('bb_onboarding', JSON.stringify(onboardingData));
          if (data.nickname) localStorage.setItem('bb_onboarding_complete', 'true');
        }
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    return { error };
  }

  async function updateProfile(updates: Partial<UserProfile>) {
    if (!user) return { error: 'No user logged in' };
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ ...updates, id: user.id, updated_at: new Date().toISOString() })
        .select()
        .single();
      
      if (error) throw error;
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async function refreshProfile() {
    if (!user) {
      console.warn('[Auth] Cannot refresh profile - no user logged in');
      return;
    }
    console.log('[Auth] Refreshing profile for user:', user.id);
    await fetchProfile(user.id);
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
