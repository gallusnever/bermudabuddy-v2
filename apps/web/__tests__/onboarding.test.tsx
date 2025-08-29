import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock dependencies
vi.mock('../lib/api', () => ({
  apiUrl: (path: string) => `http://test-api${path}`,
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      upsert: vi.fn(() => ({ error: null })),
      update: vi.fn(() => ({ 
        eq: vi.fn(() => ({ error: null }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: { id: 'test-user-id' }, error: null }))
        }))
      }))
    })),
  },
}));

// Mock UI components
vi.mock('@bermuda/ui', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  Input: (props: any) => <input {...props} />,
  Select: (props: any) => <select {...props} />,
  Icons: {},
}));

vi.mock('../components/bud-says', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

import { AccountNicknameStep } from '../app/onboarding/account-nickname-step';
import { EquipmentStep } from '../app/onboarding/onboarding-steps-v2';

describe('Onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
  });

  it('should POST property and polygons during account creation', async () => {
    const mockOnNext = vi.fn();
    const mockOnboardingData = {
      location: {
        address: '123 Test St',
        city: 'Austin',
        state: 'TX',
        lat: 30.2672,
        lon: -97.7431,
        area_sqft: 5000,
        zones: [
          { name: 'Front Yard', area: 2500, geometry: '{"type":"Polygon"}' },
          { name: 'Back Yard', area: 2500, geometry: '{"type":"Polygon"}' },
        ],
      },
      equipment: { grassType: 'bermuda', hoc: 0.75 },
      status: { zones: [
        { name: 'Front Yard', area: 2500, geometry: '{"type":"Polygon"}' },
        { name: 'Back Yard', area: 2500, geometry: '{"type":"Polygon"}' },
      ]},
    };

    // Mock property creation response
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123 }),
      })
      // Mock polygon POSTs
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 2 }) });

    render(
      <AccountNicknameStep
        onboardingData={mockOnboardingData}
        onNext={mockOnNext}
        onBack={() => {}}
      />
    );

    // Fill in the form and submit (simplified for test)
    // This would trigger the property and polygon creation

    // Verify property was created
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/properties'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('123 Test St'),
        })
      );
    });

    // Verify polygons were created
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/properties/123/polygons'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Front Yard'),
        })
      );
    });
  });

  it('should display inline validation errors for equipment', () => {
    const mockOnNext = vi.fn();
    
    render(
      <EquipmentStep 
        onNext={mockOnNext}
        onBack={() => {}}
      />
    );

    // Click next without filling required fields
    const nextButton = screen.getByText(/Next/);
    fireEvent.click(nextButton);

    // Check for inline errors
    expect(screen.getByText('Select your grass type')).toBeInTheDocument();
    expect(screen.getByText('Select your mower type')).toBeInTheDocument();
    expect(screen.getByText('Enter your height of cut')).toBeInTheDocument();
    
    // Verify no alert was called
    expect(mockOnNext).not.toHaveBeenCalled();
  });
});