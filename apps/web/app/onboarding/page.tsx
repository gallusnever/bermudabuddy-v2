"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WelcomeAgeStep } from './welcome-age-step';
import { LocationStepV2 } from './location-step-v2';
import { PropertyLocationStep, EquipmentStep, LawnStatusStep } from './onboarding-steps-v2';
import { AccountNicknameStep } from './account-nickname-step';
import { DisclaimerStep } from './onboarding-multi-step';
import { useAuth } from '../../contexts/auth-context';
import { yardState } from '../../lib/unified-yard-state';

export default function OnboardingPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  
  // Step management - New flow order
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<any>({
    ageVerified: false,
    location: {},
    grass: {},
    equipment: {},
    account: {},
    status: {},
    zones: []
  });

  // Check if user already completed onboarding
  useEffect(() => {
    if (!loading && user && profile?.nickname) {
      // User already has a profile, redirect to dashboard
      router.push('/dashboard');
    }
  }, [user, profile, loading, router]);

  // Save to localStorage on each update
  useEffect(() => {
    if (Object.keys(onboardingData).length > 1) {
      localStorage.setItem('bb_onboarding', JSON.stringify(onboardingData));
    }
  }, [onboardingData]);

  // Load existing data on mount
  useEffect(() => {
    const saved = localStorage.getItem('bb_onboarding');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setOnboardingData(data);
        // If user already verified age and has some data, skip to where they left off
        if (data.ageVerified && data.location?.state) {
          setCurrentStep(3); // Skip to grass type
        }
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
    }
  }, []);

  // Step 1: Age Verification
  const handleAgeVerified = () => {
    setOnboardingData(prev => ({ ...prev, ageVerified: true }));
    setCurrentStep(2);
  };

  // Step 2: Location
  const handleLocationNext = (data: any) => {
    setOnboardingData(prev => ({ ...prev, location: data }));
    setCurrentStep(3);
  };

  // Step 3: Property Map (grass type comes from equipment step)
  const handlePropertyNext = (data: any) => {
    setOnboardingData(prev => ({ 
      ...prev, 
      zones: data.zones || [],
      // Merge coordinates into location data
      location: {
        ...prev.location,
        lat: data.lat || data.latitude,
        lon: data.lon || data.longitude,
        latitude: data.latitude || data.lat,
        longitude: data.longitude || data.lon,
        area: data.area || prev.location.area
      }
    }));
    setCurrentStep(4);
  };

  // Step 4: Equipment (includes grass type)
  const handleEquipmentNext = (data: any) => {
    setOnboardingData(prev => ({ 
      ...prev, 
      equipment: data,
      // Also store grass data separately for consistency
      grass: {
        type: data.grassType,
        hoc: data.hoc,
        age: data.lawnAge
      }
    }));
    setCurrentStep(5);
  };

  // Step 5: Lawn Status/Issues (moved before account for context)
  const handleStatusNext = (data: any) => {
    setOnboardingData(prev => ({ ...prev, status: data }));
    setCurrentStep(6);
  };

  // Step 6: Account Creation with Nickname (now has full context)
  const handleAccountNext = async (accountData: any) => {
    setOnboardingData(prev => ({ ...prev, account: accountData }));
    
    // Initialize yard state with user ID
    if (accountData.userId) {
      await yardState.initialize(accountData.userId);
      // Save all collected data to unified state
      await yardState.update({
        yard: {
          location: onboardingData.location,
          grass: {
            type: onboardingData.grass?.type || onboardingData.equipment?.grassType || 'bermuda',
            hoc: parseFloat(onboardingData.grass?.hoc || onboardingData.equipment?.hoc || '1.0'),
            age: onboardingData.grass?.age || onboardingData.equipment?.lawnAge
          },
          zones: onboardingData.zones || []
        },
        equipment: {
          mower: {
            type: onboardingData.equipment.mower?.includes('reel') ? 'reel' : 'rotary',
            model: onboardingData.equipment.mower
          },
          sprayer: {
            type: onboardingData.equipment.sprayer || 'none',
            capacity: onboardingData.equipment.sprayerCapacity
          },
          spreader: {
            type: onboardingData.equipment.spreader || 'broadcast',
            model: onboardingData.equipment.spreader
          },
          irrigation: {
            type: onboardingData.equipment.irrigation || 'hose'
          }
        },
        soil: {
          testDone: onboardingData.equipment.soilTestDone || false,
          results: onboardingData.equipment.soilTestResults
        },
        resources: {
          monthlyBudget: parseInt(onboardingData.equipment.monthlyBudget || '50'),
          weeklyTime: parseInt(onboardingData.equipment.weeklyTime || '2'),
          diyLevel: onboardingData.equipment.experience || 'beginner'
        },
        issues: onboardingData.status?.issues || []
      });
    }
    
    setCurrentStep(7);
  };

  // Step 7: Final/Disclaimer
  const handleComplete = async () => {
    // Save everything and redirect to dashboard
    try { localStorage.setItem('bb_onboarding_complete', 'true'); } catch {}
    try { document.cookie = `bb_onboarding_complete=true; Path=/; Max-Age=31536000`; } catch {}
    router.push('/dashboard');
  };

  // Navigation handlers
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Step indicator
  const steps = [
    'Welcome',
    'Location',
    'Property Map',
    'Equipment',
    'Lawn Issues',
    'Account Setup',
    'Complete'
  ];

  return (
    <main className="min-h-screen bg-gray-900">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
              >
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold
                    ${index + 1 < currentStep ? 'bg-green-600 text-white' : ''}
                    ${index + 1 === currentStep ? 'bg-green-500 text-white ring-4 ring-green-400/30' : ''}
                    ${index + 1 > currentStep ? 'bg-gray-700 text-gray-400' : ''}
                  `}
                >
                  {index + 1 < currentStep ? '✓' : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index + 1 < currentStep ? 'bg-green-600' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`text-center ${
                  index + 1 === currentStep ? 'font-bold text-green-400' : ''
                }`}
              >
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
          {currentStep === 1 && (
            <WelcomeAgeStep onNext={handleAgeVerified} />
          )}
          
          {currentStep === 2 && (
            <LocationStepV2
              data={onboardingData.location}
              onUpdate={(data) => setOnboardingData(prev => ({ ...prev, location: data }))}
              onNext={handleLocationNext}
              onBack={handleBack}
            />
          )}
          
          {currentStep === 3 && (
            <PropertyLocationStep
              locationData={onboardingData.location}
              onNext={handlePropertyNext}
              onBack={handleBack}
            />
          )}
          
          {currentStep === 4 && (
            <EquipmentStep
              onNext={handleEquipmentNext}
              onBack={handleBack}
            />
          )}
          
          {currentStep === 5 && (
            <LawnStatusStep
              locationData={onboardingData.location}
              onNext={handleStatusNext}
              onBack={handleBack}
            />
          )}
          
          {currentStep === 6 && (
            <AccountNicknameStep
              locationData={onboardingData.location}
              equipmentData={onboardingData.equipment}
              statusData={onboardingData.status}
              onUpdate={(data) => setOnboardingData(prev => ({ ...prev, account: data }))}
              onNext={handleAccountNext}
              onBack={handleBack}
            />
          )}
          
          {currentStep === 7 && (
            <DisclaimerStep
              onBack={handleBack}
              onNext={handleComplete}
            />
          )}
        </div>
      </div>
    </main>
  );
}
