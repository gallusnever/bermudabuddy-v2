import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ 
    push: vi.fn() 
  })),
  usePathname: vi.fn(() => '/dashboard'),
}));

vi.mock('../contexts/auth-context', () => ({
  useAuth: vi.fn(() => ({
    profile: { property_id: 123 },
    refreshProfile: vi.fn(),
  })),
}));

vi.mock('../lib/api', () => ({
  apiUrl: (path: string) => `http://test-api${path}`,
}));

// Mock all UI components
vi.mock('@bermuda/ui', () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  Chip: ({ children }: any) => <div>{children}</div>,
  Badge: ({ children }: any) => <div>{children}</div>,
  Icons: {
    Gauge: () => <span>Gauge</span>,
    Layers: () => <span>Layers</span>,
    LawnLeaf: () => <span>LawnLeaf</span>,
    Wind: () => <span>Wind</span>,
    Droplet: () => <span>Droplet</span>,
    Spinner: () => <span>Spinner</span>,
    AlertTriangle: () => <span>Alert</span>,
    Activity: () => <span>Activity</span>,
    Cloud: () => <span>Cloud</span>,
  },
  Drawer: ({ children, open }: any) => open ? <div>{children}</div> : null,
  Tooltip: ({ children }: any) => <>{children}</>,
  Input: (props: any) => <input {...props} />,
  Select: (props: any) => <select {...props} />,
}));

vi.mock('../components/bud-says', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../components/pgr-gauge', () => ({
  default: () => <div>PGR Gauge</div>,
}));

vi.mock('../components/yard-sections', () => ({
  YardSections: () => <div>Yard Sections</div>,
}));

vi.mock('../components/bud-program-display', () => ({
  BudProgramDisplay: () => <div>Bud Program Display</div>,
}));

vi.mock('../components/update-conditions-modal', () => ({
  UpdateConditionsModal: () => null,
}));

import DashboardPage from '../app/dashboard/page';

const mockRouter = vi.mocked(await import('next/navigation')).useRouter;

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should navigate to /ok-to-spray?open=1 when Open hourly table is clicked', async () => {
    const pushMock = vi.fn();
    mockRouter.mockReturnValue({ push: pushMock } as any);
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        source: { provider: 'NOAA' },
        current: {},
        ok_rows: [],
      }),
    });
    
    render(<DashboardPage />);
    
    const button = screen.getByText('Open hourly table');
    button.click();
    
    expect(pushMock).toHaveBeenCalledWith('/ok-to-spray?open=1');
  });

  it('should display polygon zones when available', async () => {
    localStorage.setItem('bb_property_id', '123');
    
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          source: { provider: 'NOAA' },
          current: {},
          ok_rows: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123, area_sqft: 5000 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, name: 'Front Yard', area_sqft: 2500 },
          { id: 2, name: 'Back Yard', area_sqft: 2500 },
        ],
      });
    
    render(<DashboardPage />);
    
    // Wait for zones to be fetched
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/properties/123/polygons')
      );
    });
    
    // Verify zones are displayed (not "No zones saved yet")
    expect(screen.getByText('Zones')).toBeInTheDocument();
    expect(screen.queryByText('No zones saved yet')).not.toBeInTheDocument();
  });
});