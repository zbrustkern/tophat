import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../app/page';

// Mock contexts
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/contexts/PlansContext', () => ({
  usePlans: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';
import { usePlans } from '@/contexts/PlansContext';

describe('User Story: Dashboard displays saved plans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state when user has no plans', () => {
    (useAuth as any).mockReturnValue({ user: { uid: '123', email: 'test@example.com' }, loading: false });
    (usePlans as any).mockReturnValue({ plans: [], loading: false });

    render(<Dashboard />);

    expect(screen.getByText('No Plans Yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first financial plan by clicking one of the buttons above.')).toBeInTheDocument();
  });

  it('displays all a users saved plans', () => {
    (useAuth as any).mockReturnValue({ user: { uid: '123', email: 'test@example.com' }, loading: false });
    (usePlans as any).mockReturnValue({
      plans: [
        { id: '1', planName: 'My Awesome Income Plan', planType: 'income', details: { income: 100000 } },
        { id: '2', planName: 'Retirement Savings', planType: 'savings', details: { desiredIncome: 80000 } }
      ],
      loading: false
    });

    render(<Dashboard />);

    // Verify Income Plan shows up
    expect(screen.getByText('My Awesome Income Plan')).toBeInTheDocument();
    // Verify Savings Plan shows up
    expect(screen.getByText('Retirement Savings')).toBeInTheDocument();
  });
});
