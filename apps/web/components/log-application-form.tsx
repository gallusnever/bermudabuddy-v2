"use client";
import { useState, useEffect } from 'react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Icons } from '@bermuda/ui';
import { apiUrl } from '../lib/api';

interface LogApplicationFormProps {
  propertyId: string;
  onClose: () => void;
  onSuccess: (newApplication: any) => void;
}

// Common products for autocomplete
const COMMON_PRODUCTS = [
  'Prodiamine 65 WDG',
  'Certainty',
  'Celsius WG',
  'FEature 6-0-0',
  'Main Event',
  'Primo Maxx',
  'Anuew PGR',
  'Azoxystrobin 2SC',
  'Propiconazole 14.3',
  'Bifen I/T',
  'Imidacloprid 0.5G',
  'Dylox 420 SL',
  'Milorganite',
  'Carbon X',
  'Stress 12-0-24',
  'Humic DG',
  'RGS',
  'Air-8',
  'Custom Mix'
];

export function LogApplicationForm({ propertyId, onClose, onSuccess }: LogApplicationFormProps) {
  const [form, setForm] = useState({
    product_id: '',
    rate_value: '',
    rate_unit: 'oz/1000',
    area_sqft: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState(COMMON_PRODUCTS);

  useEffect(() => {
    // Load saved area from localStorage if available
    try {
      const profile = JSON.parse(localStorage.getItem('bb_onboarding') || '{}');
      if (profile?.location?.area) {
        setForm(f => ({ ...f, area_sqft: String(profile.location.area) }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    // Filter products based on input
    const filtered = COMMON_PRODUCTS.filter(p => 
      p.toLowerCase().includes(form.product_id.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [form.product_id]);

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!form.product_id.trim()) {
      errors.product_id = 'Product name is required';
    }
    
    const rateValue = parseFloat(form.rate_value);
    if (!form.rate_value || isNaN(rateValue) || rateValue <= 0) {
      errors.rate_value = 'Rate must be a positive number';
    }
    
    if (form.rate_unit === 'oz/1000' || form.rate_unit === 'lb/1000') {
      const area = parseFloat(form.area_sqft);
      if (!form.area_sqft || isNaN(area) || area <= 0) {
        errors.area_sqft = 'Area is required for per-1000 rates';
      }
    }
    
    if (!form.date) {
      errors.date = 'Application date is required';
    }
    
    // Check if date is in the future
    const appDate = new Date(form.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (appDate > today) {
      errors.date = 'Cannot log future applications';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);

    try {
      const payload = {
        product_id: form.product_id.trim(),
        rate_value: parseFloat(form.rate_value),
        rate_unit: form.rate_unit,
        area_sqft: form.area_sqft ? parseFloat(form.area_sqft) : null,
        date: form.date,
        notes: form.notes.trim() || null
      };
      
      const res = await fetch(apiUrl(`/api/properties/${propertyId}/applications`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || `Server error: ${res.status}`);
      }

      const newApp = await res.json();
      onSuccess(newApp);
    } catch (err) {
      console.error('[LogApplication] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save application');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bb-clay">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Icons.Beaker /> Log Application
          </span>
          <button 
            onClick={onClose}
            className="text-muted hover:text-white"
            aria-label="Close"
          >
            <Icons.X />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium mb-1">Product Name</label>
            <Input
              value={form.product_id}
              onChange={(e) => {
                setForm(f => ({ ...f, product_id: e.target.value }));
                setShowProductSuggestions(true);
                if (validationErrors.product_id) {
                  setValidationErrors(prev => ({ ...prev, product_id: '' }));
                }
              }}
              onFocus={() => setShowProductSuggestions(true)}
              onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
              placeholder="e.g., Prodiamine 65 WDG"
              className={validationErrors.product_id ? 'border-red-500' : ''}
            />
            {validationErrors.product_id && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.product_id}</p>
            )}
            {showProductSuggestions && filteredProducts.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded max-h-48 overflow-y-auto">
                {filteredProducts.map(product => (
                  <button
                    key={product}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm"
                    onClick={() => {
                      setForm(f => ({ ...f, product_id: product }));
                      setShowProductSuggestions(false);
                    }}
                  >
                    {product}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Rate</label>
              <Input
                type="number"
                step="0.01"
                value={form.rate_value}
                onChange={(e) => {
                  setForm(f => ({ ...f, rate_value: e.target.value }));
                  if (validationErrors.rate_value) {
                    setValidationErrors(prev => ({ ...prev, rate_value: '' }));
                  }
                }}
                placeholder="0.5"
                className={validationErrors.rate_value ? 'border-red-500' : ''}
              />
              {validationErrors.rate_value && (
                <p className="text-red-400 text-xs mt-1">{validationErrors.rate_value}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <select 
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
                value={form.rate_unit}
                onChange={(e) => setForm(f => ({ ...f, rate_unit: e.target.value }))}
              >
                <option value="oz/1000">oz/1000 ft²</option>
                <option value="lb/1000">lb/1000 ft²</option>
                <option value="oz/gal">oz/gal</option>
                <option value="ml/L">ml/L</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Area Treated (ft²)</label>
              <Input
                type="number"
                value={form.area_sqft}
                onChange={(e) => {
                  setForm(f => ({ ...f, area_sqft: e.target.value }));
                  if (validationErrors.area_sqft) {
                    setValidationErrors(prev => ({ ...prev, area_sqft: '' }));
                  }
                }}
                placeholder="5000"
                className={validationErrors.area_sqft ? 'border-red-500' : ''}
              />
              {validationErrors.area_sqft && (
                <p className="text-red-400 text-xs mt-1">{validationErrors.area_sqft}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date Applied</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => {
                  setForm(f => ({ ...f, date: e.target.value }));
                  if (validationErrors.date) {
                    setValidationErrors(prev => ({ ...prev, date: '' }));
                  }
                }}
                max={new Date().toISOString().split('T')[0]}
                className={validationErrors.date ? 'border-red-500' : ''}
              />
              {validationErrors.date && (
                <p className="text-red-400 text-xs mt-1">{validationErrors.date}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Weather conditions, observations, etc."
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-700 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Application'}
            </Button>
          </div>
        </form>

        <div className="mt-4 p-3 bb-card border-l-4 border-blue-700/50">
          <div className="flex items-start gap-2">
            <img src="/bud-close.png" alt="Bud" className="w-8 h-8 rounded-full" />
            <div className="text-xs text-muted">
              <strong className="text-blue-400">Bud says:</strong> Write it down or it didn't happen. 
              The EPA doesn't care that you "think" you applied at the right rate.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}