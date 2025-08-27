"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle, Chip, Icons } from '@bermuda/ui';
import Link from 'next/link';
import AlertsBanner from './parts/alerts-banner';
import BudSays, { getRandomTip } from '../components/bud-says';
import { useAuth } from '../contexts/auth-context';

export default function HomePage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is authenticated and has completed onboarding
    if (!loading) {
      if (user && profile?.nickname) {
        // User is authenticated and has completed onboarding
        setOnboardingComplete(true);
        localStorage.setItem('bb_onboarding_complete', 'true');
        localStorage.setItem('bb_onboarding', JSON.stringify({
          account: { nickname: profile.nickname }
        }));
      } else if (user && !profile?.nickname) {
        // User is authenticated but hasn't completed onboarding
        setOnboardingComplete(false);
      } else {
        // No authenticated user - check localStorage for non-auth users
        const complete = localStorage.getItem('bb_onboarding_complete') === 'true';
        setOnboardingComplete(complete);
      }
    }
  }, [user, profile, loading]);

  // Show loading state while checking
  if (loading || onboardingComplete === null) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <img src="/bud-logo.png" alt="Bermuda Buddy" className="h-32 w-auto mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  // If not complete, show login/signup options
  if (!onboardingComplete) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6">
          <Card className="bb-clay">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Welcome to Bermuda Buddy!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <BudSays category="login" />
              
              <div className="space-y-3">
                <Link href="/onboarding" className="block">
                  <Button size="lg" className="w-full">
                    Start Setup (New Users)
                  </Button>
                </Link>
                
                <Link href="/login" className="block">
                  <Button size="lg" variant="outline" className="w-full">
                    Sign In (Existing Users)
                  </Button>
                </Link>
              </div>
              
              <p className="text-xs text-gray-500 text-center mt-4">
                Don't know which one? If you've been here before, you'll know. Otherwise, start fresh.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Normal home page for users who completed onboarding
  return (
    <main className="min-h-screen">
      <section className="relative pt-24 pb-28">
        <div className="absolute inset-0 -z-10 bb-hero" />
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="bb-card bb-clay p-8 md:p-10">
            <div className="flex items-center gap-3 text-emerald-300/90 mb-2">
              <Icons.LawnLeaf />
              <span className="text-xs tracking-wide">Premium Lawncare Platform</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-3">
              Bermuda Buddy
            </h1>
            <p className="text-muted max-w-2xl">
              Production-grade PWA for serious DIY Bermuda lawn care. Compliance‑first, weather‑aware, and delightfully fast.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard" className="inline-flex">
                <Button size="lg">Open Dashboard</Button>
              </Link>
              <Link href="/yard-state">
                <Button variant="soft" size="lg">Yard State</Button>
              </Link>
              <a href="#learn" className="bb-link-premium text-sm self-center">Learn More</a>
            </div>
            <div className="mt-6">
              <AlertsBanner />
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bb-clay">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Icons.AlertTriangle /> Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <Chip>Label‑first guidance</Chip>
                <p className="text-sm text-muted">Always links to the federal PDF, with RUP visibility.</p>
              </CardContent>
            </Card>
            <Card className="bb-clay">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Icons.Wind /> Weather</CardTitle>
              </CardHeader>
              <CardContent>
                <Chip>Predictive insights</Chip>
                <p className="text-sm text-muted">Know when to spray, when to wait, and when to pray for rain.</p>
              </CardContent>
            </Card>
            <Card className="bb-clay">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Icons.Beaker /> Mix Builder</CardTitle>
              </CardHeader>
              <CardContent>
                <Chip>Perfect ratios</Chip>
                <p className="text-sm text-muted">Calculate exact amounts based on your area and equipment.</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <BudSays category="login" />
          </div>
        </div>
      </section>
    </main>
  );
}