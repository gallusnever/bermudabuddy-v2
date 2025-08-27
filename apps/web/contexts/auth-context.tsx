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
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkUser();

    // Add timeout fallback to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth check timed out, setting loading to false');
        setLoading(false);
      }
    }, 3000);

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      // Set loading false after auth state change if checkUser hasn't run yet
      if (loading) {
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      authListener?.subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle to avoid error if no profile exists
      
      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setProfile(data);
        // Also update localStorage with the profile data
        const onboardingData = {
          account: { 
            nickname: data.nickname || 'LawnWarrior',
            email: data.email,
            firstName: data.first_name,
            lastName: data.last_name
          },
          location: {
            city: data.city,
            state: data.state,
            zip: data.zip,
            area: data.area_sqft
          },
          equipment: {
            hoc: data.hoc,
            mower: data.mower,
            irrigation: data.irrigation,
            sprayer: data.sprayer
          },
          grass: {
            type: data.grass_type
          }
        };
        localStorage.setItem('bb_onboarding', JSON.stringify(onboardingData));
        if (data.nickname) {
          localStorage.setItem('bb_onboarding_complete', 'true');
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

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
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