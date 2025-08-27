"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@bermuda/ui';
import BudSays, { getRandomTip } from '../../components/bud-says';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (data.user) {
        console.log('Login successful, fetching profile for:', data.user.email);
        
        // Add timeout for profile fetch
        const profileTimeout = setTimeout(() => {
          console.warn('Profile fetch timed out, redirecting with basic info');
          localStorage.setItem('bb_onboarding_complete', 'true');
          localStorage.setItem('bb_onboarding', JSON.stringify({
            account: { 
              nickname: 'LawnWarrior',
              email: data.user.email 
            }
          }));
          router.push('/dashboard');
        }, 5000);
        
        // Try to get the user's profile with all their lawn data
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle(); // Use maybeSingle instead of single to avoid error if no profile exists

          clearTimeout(profileTimeout);
          console.log('Profile fetch result:', { profile, profileError });

          if (profile) {
            // User has a profile - store all their data
            localStorage.setItem('bb_onboarding_complete', 'true');
            
            // Store the full profile data for the app to use
            const onboardingData = {
              account: { 
                nickname: profile.nickname || 'LawnWarrior',
                email: data.user.email,
                firstName: profile.first_name,
                lastName: profile.last_name
              },
              location: {
                city: profile.city,
                state: profile.state,
                zip: profile.zip,
                area: profile.area_sqft
              },
              equipment: {
                hoc: profile.hoc,
                mower: profile.mower,
                irrigation: profile.irrigation,
                sprayer: profile.sprayer
              },
              grass: {
                type: profile.grass_type
              }
            };
            
            localStorage.setItem('bb_onboarding', JSON.stringify(onboardingData));
            console.log('Profile loaded, redirecting to dashboard with data:', onboardingData);
            router.push('/dashboard');
          } else {
            // No profile exists - create a basic one
            console.log('No profile found, creating basic profile');
            
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                email: data.user.email,
                nickname: 'LawnWarrior',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .maybeSingle();

            if (newProfile) {
              localStorage.setItem('bb_onboarding_complete', 'true');
              localStorage.setItem('bb_onboarding', JSON.stringify({
                account: { 
                  nickname: 'LawnWarrior',
                  email: data.user.email 
                }
              }));
              console.log('Basic profile created, redirecting to dashboard');
              router.push('/dashboard');
            } else {
              // If profile creation fails, still let them in but suggest onboarding
              console.error('Profile creation failed:', createError);
              localStorage.setItem('bb_onboarding_complete', 'false');
              router.push('/onboarding');
            }
          }
        } catch (err) {
          clearTimeout(profileTimeout);
          console.error('Error fetching/creating profile:', err);
          // On error, still log them in but suggest completing profile
          localStorage.setItem('bb_onboarding_complete', 'true');
          localStorage.setItem('bb_onboarding', JSON.stringify({
            account: { 
              nickname: 'LawnWarrior',
              email: data.user.email 
            }
          }));
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Sign in failed:', error);
      setError(error.message || 'Failed to sign in. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        <Card className="bb-clay">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Welcome Back!</CardTitle>
          </CardHeader>
          <CardContent>
            <BudSays category="login" />
            
            <form onSubmit={handleSignIn} className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                  className="bg-gray-700 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="bg-gray-700 text-white"
                />
              </div>
              
              {error && (
                <div className="bg-red-900/30 border border-red-500 rounded p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              
              <Button 
                type="submit" 
                size="lg" 
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-400">
                Don't have an account?
              </p>
              <Link href="/onboarding">
                <Button variant="outline" size="sm">
                  Start Fresh with New Setup
                </Button>
              </Link>
            </div>
            
            <div className="mt-4 text-center">
              <Link href="/" className="text-xs text-gray-500 hover:text-gray-400">
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}