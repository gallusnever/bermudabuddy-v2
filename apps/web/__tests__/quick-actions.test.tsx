import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock all dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ 
    push: vi.fn() 
  })),
  usePathname: vi.fn(() => '/yard-state'),
}));

vi.mock('../contexts/auth-context', () => ({
  useAuth: vi.fn(() => ({
    profile: {},
  })),
}));

vi.mock('../lib/api', () => ({
  apiUrl: (path: string) => `http://test-api${path}`,
}));

// Mock UI components
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
  Input: (props: any) => <input {...props} />,
  Select: (props: any) => <select {...props} />,
  Icons: {
    Settings: () => <span>Settings</span>,
    AlertTriangle: () => <span>Alert</span>,
  },
  Tooltip: ({ children }: any) => <>{children}</>,
}));

vi.mock('../components/bud-says', () => ({
  default: () => null,
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

vi.mock('../lib/openrouter', () => ({
  analyzeYardData: vi.fn(),
  generatePresidentialAddress: vi.fn(),
}));

import YardStatePage from '../app/yard-state/page';

describe('Quick Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should route View PGR Schedule to /mix', () => {
    // Mock window.location.href setter
    delete (window as any).location;
    window.location = { href: '' } as any;
    
    render(<YardStatePage />);
    
    const pgrButton = screen.getByText('View PGR Schedule');
    fireEvent.click(pgrButton);
    
    expect(window.location.href).toBe('/mix');
  });

  it('should route Calculate Mix Rates to /mix', () => {
    // Mock window.location.href setter
    delete (window as any).location;
    window.location = { href: '' } as any;
    
    render(<YardStatePage />);
    
    const mixButton = screen.getByText('Calculate Mix Rates');
    fireEvent.click(mixButton);
    
    expect(window.location.href).toBe('/mix');
  });
});