import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ 
    push: vi.fn() 
  })),
}));

vi.mock('../contexts/auth-context', () => ({
  useAuth: vi.fn(() => ({
    profile: null,
  })),
}));

vi.mock('../lib/api', () => ({
  apiUrl: (path: string) => `http://test-api${path}`,
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
  Chip: ({ children }: any) => <div>{children}</div>,
  Badge: ({ children }: any) => <div>{children}</div>,
  Input: (props: any) => <input {...props} />,
  Select: (props: any) => <select {...props} />,
  Checkbox: (props: any) => <input type="checkbox" {...props} />,
  Drawer: () => null,
  Tooltip: ({ children }: any) => <>{children}</>,
  Icons: {},
}));

vi.mock('../components/bud-says', () => ({
  default: () => null,
}));

vi.mock('../components/onboarding-gate', () => ({
  OnboardingGate: () => (
    <div>
      <div>Complete Onboarding to Save Applications</div>
      <button>Resume Onboarding</button>
    </div>
  ),
}));

import MixBuilderPage from '../app/mix/page';

const mockUseAuth = vi.mocked(await import('../contexts/auth-context')).useAuth;
const mockRouter = vi.mocked(await import('next/navigation')).useRouter;

describe('MixBuilderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
  });

  it('should show onboarding banner when no property_id available', async () => {
    mockUseAuth.mockReturnValue({ profile: null } as any);
    
    render(<MixBuilderPage />);
    
    // Try to save without property_id
    const saveButton = screen.getByText('Save Application');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Complete Onboarding to Save Applications')).toBeInTheDocument();
      expect(screen.getByText('Resume Onboarding')).toBeInTheDocument();
    });
  });

  it('should save and redirect when property_id is available', async () => {
    const pushMock = vi.fn();
    mockRouter.mockReturnValue({ push: pushMock } as any);
    mockUseAuth.mockReturnValue({ 
      profile: { property_id: 123 } 
    } as any);
    
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ batch_id: 'test-batch-123' }),
      });
    
    render(<MixBuilderPage />);
    
    // Mock that labels are available
    const saveButton = screen.getByText('Save Application');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Application saved! Redirecting.../)).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Check redirect happens after delay
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/applications');
    }, { timeout: 2000 });
  });

  it('should use localStorage property_id as fallback', async () => {
    mockUseAuth.mockReturnValue({ profile: null } as any);
    localStorage.setItem('bb_property_id', '456');
    
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ batch_id: 'test-batch-456' }),
      });
    
    render(<MixBuilderPage />);
    
    const saveButton = screen.getByText('Save Application');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/applications/bulk'),
        expect.objectContaining({
          body: expect.stringContaining('"property_id":456'),
        })
      );
    });
  });
});