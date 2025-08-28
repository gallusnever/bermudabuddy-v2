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
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      if (data.user) {
        // Immediately mark onboarding as complete so middleware allows protected routes
        try { localStorage.setItem('bb_onboarding_complete', 'true'); } catch {}
        try { document.cookie = `bb_onboarding_complete=true; Path=/; Max-Age=31536000`; } catch {}
        router.push('/dashboard');
        // Non-blocking profile bootstrap
        (async () => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user!.id)
              .maybeSingle();
            if (!profile) {
              await supabase
                .from('profiles')
                .insert({ id: data.user!.id, email: data.user!.email, nickname: 'LawnWarrior', created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
                .select()
                .maybeSingle();
            }
          } catch (e) {
            console.warn('Profile bootstrap failed (non-blocking):', e);
          }
        })();
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
