"use client";
import { useState } from 'react';
import { Button } from '@bermuda/ui';
import BudSays from '../../components/bud-says';

interface WelcomeAgeStepProps {
  onNext: () => void;
}

export function WelcomeAgeStep({ onNext }: WelcomeAgeStepProps) {
  const [ageVerified, setAgeVerified] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const handleYes = () => {
    setAgeVerified(true);
    onNext();
  };

  const handleNo = () => {
    setShowWarning(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-green-400">Welcome to Bud's Club!</h1>
        <p className="text-lg text-gray-300">
          The exclusive lawn domination society for serious bermuda grass enthusiasts
        </p>
      </div>

      <BudSays 
        message="Listen up, future grass slayer! Before we dive into the good stuff, I gotta ask you something important. This ain't no place for kids - we're dealing with dangerous equipment, chemicals that'll make your grass greener than your neighbor's envy, and language that might make your HOA blush."
        variant="warning"
      />

      {!showWarning ? (
        <div className="bg-gray-700 rounded-lg border-2 border-green-600 p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">
            Are you 18 years or older?
          </h2>
          
          <div className="text-sm text-gray-300 mb-8 space-y-2">
            <p>By confirming you are 18+, you acknowledge that:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>You can legally operate power equipment</li>
              <li>You can handle lawn chemicals responsibly</li>
              <li>You understand the risks of scalping your lawn</li>
              <li>You won't cry when I roast your mowing patterns</li>
              <li>You can handle the truth about fescue being inferior</li>
            </ul>
          </div>

          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleYes}
              className="px-8"
            >
              Yes, I'm 18+
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleNo}
              className="px-8"
            >
              No, I'm a Kid
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 rounded-lg border-2 border-red-600 p-8">
          <h2 className="text-2xl font-bold mb-4 text-red-800">
            Sorry, Kid!
          </h2>
          <p className="text-gray-700 mb-6">
            Come back when you're old enough to handle a real mower. Until then, 
            go practice with your Fisher-Price bubble mower and let the adults 
            handle the serious turf management.
          </p>
          <p className="text-sm text-gray-600">
            (Close this tab and go ask your parents about proper lawn care)
          </p>
        </div>
      )}
    </div>
  );
}