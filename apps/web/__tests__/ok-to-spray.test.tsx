import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock all dependencies upfront
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  usePathname: vi.fn(() => '/ok-to-spray'),
}));

vi.mock('../contexts/auth-context', () => ({
  useAuth: vi.fn(() => ({ profile: null })),
}));

vi.mock('../lib/api', () => ({
  apiUrl: (path: string) => `http://test-api${path}`,
}));

vi.mock('../lib/supabase', () => ({
  supabase: {},
}));

vi.mock('../components/bud-says', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@bermuda/ui', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  Drawer: ({ open, children, title }: any) => open ? <div data-testid="drawer">{title}{children}</div> : null,
  Chip: ({ children }: any) => <div>{children}</div>,
  Badge: ({ children }: any) => <div>{children}</div>,
  Icons: {
    Wind: () => <span>Wind</span>,
    AlertTriangle: () => <span>Alert</span>,
  },
  Tooltip: ({ children }: any) => <>{children}</>,
}));

import OkToSprayPage from '../app/ok-to-spray/page';

const mockUseAuth = vi.mocked(await import('../contexts/auth-context')).useAuth;
const mockUseSearchParams = vi.mocked(await import('next/navigation')).useSearchParams;

describe('OkToSprayPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
  });

  it('should not show Dallas anywhere in the UI', () => {
    mockUseAuth.mockReturnValue({ profile: null } as any);
    render(<OkToSprayPage />);
    
    // Check that Dallas doesn't appear anywhere
    expect(screen.queryByText(/Dallas/i)).not.toBeInTheDocument();
    expect(screen.getByText('Fetch spray window')).toBeInTheDocument();
  });

  it('should display location from profile when available', () => {
    mockUseAuth.mockReturnValue({
      profile: {
        city: 'Austin',
        state: 'TX',
      }
    } as any);
    
    render(<OkToSprayPage />);
    expect(screen.getByText('Location: Austin, TX')).toBeInTheDocument();
  });

  it('should display coordinates when city not available', () => {
    mockUseAuth.mockReturnValue({
      profile: {
        lat: 30.2672,
        lon: -97.7431,
      }
    } as any);
    
    render(<OkToSprayPage />);
    expect(screen.getByText('Location: 30.27°, -97.74°')).toBeInTheDocument();
  });

  it('should auto-open drawer when ?open=1 param is present', async () => {
    // Mock window.location.search
    Object.defineProperty(window, 'location', {
      value: { search: '?open=1' },
      writable: true,
    });
    
    mockUseAuth.mockReturnValue({ profile: null } as any);
    
    // Mock successful API response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        table: [{ ts: '2024-01-01T12:00:00', status: 'OK', rules: {} }],
        source: { provider: 'NOAA' }
      })
    });
    
    render(<OkToSprayPage />);
    
    // Wait for drawer to open and fetch to be called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/weather/ok-to-spray')
      );
    });
    
    // Verify drawer is open
    await waitFor(() => {
      expect(screen.getByTestId('drawer')).toBeInTheDocument();
      expect(screen.getByText('Spray Window Analysis')).toBeInTheDocument();
    });
  });

  it('should use correct coordinate resolution order', async () => {
    mockUseAuth.mockReturnValue({
      profile: {
        lat: 30.2672,
        lon: -97.7431,
        latitude: 32.7767, // should be ignored
        longitude: -96.7970, // should be ignored
      }
    } as any);
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        table: [],
        source: { provider: 'NOAA' }
      })
    });
    
    render(<OkToSprayPage />);
    fireEvent.click(screen.getByText('Fetch spray window'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('lat=30.2672&lon=-97.7431')
      );
    });
  });

  it('should display error message on API failure', async () => {
    mockUseAuth.mockReturnValue({ profile: null } as any);
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    
    render(<OkToSprayPage />);
    fireEvent.click(screen.getByText('Fetch spray window'));
    
    await waitFor(() => {
      expect(screen.getByText('Weather service error: 500')).toBeInTheDocument();
    });
  });
});