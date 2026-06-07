import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import IncomePlanner from '../components/IncomePlanner';

// Mock hooks
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('@/contexts/PlansContext', () => ({
  usePlans: vi.fn(),
}));
vi.mock('@/hooks/useIncomePlan', () => ({
  useIncomePlan: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';
import { usePlans } from '@/contexts/PlansContext';

describe('User Story: Income Planner Hydration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prepouplates the component page with the saved plan information when clicked from dashboard', () => {
    (useAuth as any).mockReturnValue({ user: { uid: '123' } });
    
    // Simulate usePlans having an existing plan that matches the ID
    (usePlans as any).mockReturnValue({ 
      plans: [{
        id: 'plan-123',
        planName: 'My Hydrated Plan',
        planType: 'income',
        details: {
          income: 150000,
          raiseRate: 0.05,
          saveRate: 0.25,
          taxRate: 0.35,
          balance: 500000,
          returnRate: 0.07,
          autoEscalateSavings: true,
          escalationRate: 0.02
        }
      }], 
      loading: false 
    });

    render(<IncomePlanner planId="plan-123" />);

    // Verify the inputs were populated from the loaded plan
    expect(parseFloat((screen.getByLabelText(/Income in \$\/year/i) as HTMLInputElement).value)).toBe(150000);
    expect(parseFloat((screen.getByLabelText(/Estimated Annual Raise/i) as HTMLInputElement).value)).toBeCloseTo(5);
    expect(parseFloat((screen.getByLabelText(/Savings Rate/i) as HTMLInputElement).value)).toBeCloseTo(25);
    expect(parseFloat((screen.getByLabelText(/Starting Balance \$/i) as HTMLInputElement).value)).toBe(500000);
    expect(parseFloat((screen.getByLabelText(/Tax Rate/i) as HTMLInputElement).value)).toBeCloseTo(35);
    expect(parseFloat((screen.getByLabelText(/Estimated Portfolio Return/i) as HTMLInputElement).value)).toBeCloseTo(7);
  });
});
