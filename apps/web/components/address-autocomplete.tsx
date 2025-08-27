"use client";
import { useState, useRef, useEffect } from 'react';
import { Input } from '@bermuda/ui';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, components: AddressComponents) => void;
  placeholder?: string;
  className?: string;
}

export interface AddressComponents {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

// Free alternative using Nominatim (OpenStreetMap)
export function AddressAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Start typing your address...",
  className 
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();

  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Using Nominatim (free OpenStreetMap geocoding)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` + 
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=5&` +
        `countrycodes=us`
      );
      
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Address search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue, {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    });

    // Debounce the search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      searchAddress(newValue);
    }, 300);
  };

  const selectAddress = (place: any) => {
    const components: AddressComponents = {
      street: `${place.address?.house_number || ''} ${place.address?.road || ''}`.trim(),
      city: place.address?.city || place.address?.town || place.address?.village || '',
      state: getStateAbbreviation(place.address?.state || ''),
      zip: place.address?.postcode || '',
      country: 'US'
    };

    const fullAddress = place.display_name;
    onChange(fullAddress, components);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Convert state name to abbreviation
  const getStateAbbreviation = (stateName: string): string => {
    const states: { [key: string]: string } = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
      'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
      'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
      'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
      'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
      'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
      'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
      'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
      'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
      'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
      'Wisconsin': 'WI', 'Wyoming': 'WY'
    };
    return states[stateName] || stateName;
  };

  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
        onFocus={() => value.length > 2 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
      />
      
      {loading && (
        <div className="absolute right-2 top-2 text-sm text-gray-500">
          Loading...
        </div>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 border-b last:border-b-0"
              onClick={() => selectAddress(suggestion)}
            >
              <div className="text-sm font-medium">{suggestion.display_name.split(',')[0]}</div>
              <div className="text-xs text-gray-500">
                {suggestion.display_name.split(',').slice(1).join(',')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}