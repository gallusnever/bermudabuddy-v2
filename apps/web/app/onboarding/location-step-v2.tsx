"use client";
import { useState } from 'react';
import { Button, Input, Select } from '@bermuda/ui';
import BudSays from '../../components/bud-says';

interface LocationData {
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface LocationStepProps {
  data: LocationData;
  onUpdate: (data: LocationData) => void;
  onNext: () => void;
  onBack: () => void;
}

export function LocationStepV2({ data, onUpdate, onNext, onBack }: LocationStepProps) {
  const [localData, setLocalData] = useState<LocationData>({
    address: data.address || '',
    city: data.city || '',
    state: data.state || '',
    zip: data.zip || ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});


  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!localData.address) {
      newErrors.address = 'Come on, I need your address to know your climate zone';
    }
    if (!localData.state) {
      newErrors.state = 'State is required - different states have different grass seasons';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onUpdate(localData);
      onNext(localData); // Pass the data to onNext
    }
  };

  // Manual state selection for edge cases
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4 text-white">Where's Your Turf?</h2>
        <p className="text-gray-300">
          I need to know your location to give you region-specific advice. 
          Different climates need different approaches.
        </p>
      </div>

      <BudSays 
        message="Pro tip: Your location determines everything - when to apply pre-emergent, when bermuda goes dormant, and whether you're in the transition zone where fescue lovers try to corrupt you."
        variant="info"
      />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-200">
            Street Address
          </label>
          <Input
            value={localData.address}
            onChange={(e) => {
              setLocalData({ ...localData, address: e.target.value });
              if (errors.address) setErrors({ ...errors, address: '' });
            }}
            placeholder="123 Main St"
            className={errors.address ? 'border-red-500 bg-gray-700 text-white' : 'bg-gray-700 text-white'}
          />
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-200">
              City
            </label>
            <Input
              value={localData.city}
              onChange={(e) => setLocalData({ ...localData, city: e.target.value })}
              placeholder="Dallas"
              className="bg-gray-700 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-200">
              State
            </label>
            <Select
              value={localData.state}
              onChange={(e) => setLocalData({ ...localData, state: e.target.value })}
              className={errors.state ? 'border-red-500 bg-gray-700 text-white' : 'bg-gray-700 text-white'}
            >
              <option value="">Select State</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </Select>
            {errors.state && (
              <p className="text-red-500 text-sm mt-1">{errors.state}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-200">
            ZIP Code
          </label>
          <Input
            value={localData.zip}
            onChange={(e) => setLocalData({ ...localData, zip: e.target.value })}
            placeholder="75001"
            className="bg-gray-700 text-white"
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>
          Next: Property Map
        </Button>
      </div>
    </div>
  );
}