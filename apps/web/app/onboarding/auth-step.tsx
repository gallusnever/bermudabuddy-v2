"use client";
import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@bermuda/ui';
import BudSays from '../../components/bud-says';

export function AuthStep({ 
  onNext, 
  onBack,
  onAuth
}: { 
  onNext: () => void; 
  onBack: () => void;
  onAuth: (email: string, password: string, isSignUp: boolean) => Promise<boolean>;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (isSignUp && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const success = await onAuth(email, password, isSignUp);
      if (success) {
        onNext();
      } else {
        setError(isSignUp ? 'Failed to create account' : 'Invalid email or password');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Allow skipping in dev mode
    if (process.env.NEXT_PUBLIC_E2E_AUTH_BYPASS === '1') {
      onNext();
    }
  };

  return (
    <Card className="bb-clay">
      <CardHeader>
        <CardTitle>Create Your Account</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <BudSays>
            {isSignUp 
              ? "Let's save your progress! Create an account to track your lawn's journey and get personalized recommendations." 
              : "Welcome back! Sign in to continue where you left off."}
          </BudSays>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-[#00ff00] hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2 font-medium">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm mb-2 font-medium">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm mb-2 font-medium">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={onBack}>Back</Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
            {process.env.NEXT_PUBLIC_E2E_AUTH_BYPASS === '1' && (
              <Button variant="ghost" onClick={handleSkip}>Skip</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}