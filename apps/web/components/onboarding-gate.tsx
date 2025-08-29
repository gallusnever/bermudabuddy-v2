"use client";
import { Button } from '@bermuda/ui';
import { useRouter } from 'next/navigation';

export function OnboardingGate() {
  const router = useRouter();
  
  return (
    <div className="mb-6 p-4 bg-amber-900/20 border-l-4 border-amber-600 rounded">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-amber-400">Complete Onboarding to Save Applications</div>
          <div className="text-sm text-muted mt-1">You need to finish setting up your property to save mix applications.</div>
        </div>
        <Button variant="soft" onClick={() => router.push('/onboarding')}>
          Resume Onboarding
        </Button>
      </div>
    </div>
  );
}