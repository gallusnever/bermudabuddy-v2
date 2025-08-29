import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock dependencies
vi.mock('next/link', () => ({
  default: ({ children }: any) => children,
}));

vi.mock('../contexts/auth-context', () => ({
  useAuth: vi.fn(),
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
  Input: ({ onChange, value }: any) => (
    <input onChange={onChange} value={value} />
  ),
  Chip: ({ children }: any) => <div>{children}</div>,
  Icons: {
    Settings: () => <span>Settings</span>,
  },
}));

import SettingsPage from '../app/settings/page';

const mockUseAuth = vi.mocked(await import('../contexts/auth-context')).useAuth;

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save settings and refresh profile', async () => {
    const mockUpdateProfile = vi.fn().mockResolvedValue({ error: null });
    const mockRefreshProfile = vi.fn();
    
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user' },
      profile: {
        grass_type: 'bermuda',
        hoc: 0.75,
        mower: 'reel',
      },
      updateProfile: mockUpdateProfile,
      refreshProfile: mockRefreshProfile,
    } as any);
    
    render(<SettingsPage />);
    
    // Change a value
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'zoysia' } });
    
    // Click save
    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);
    
    // Verify update was called
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          grass_type: 'zoysia',
        })
      );
    });
    
    // Verify refresh was called
    await waitFor(() => {
      expect(mockRefreshProfile).toHaveBeenCalled();
    });
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('Settings saved successfully!')).toBeInTheDocument();
    });
  });
});