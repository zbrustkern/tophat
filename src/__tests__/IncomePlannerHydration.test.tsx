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
vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';
import { usePlans } from '@/contexts/PlansContext';
import { useSettings } from '@/contexts/SettingsContext';

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
          escalationRate: 0.02,
          useGlobalSettings: false
        }
      }], 
      loading: false 
    });

    (useSettings as any).mockReturnValue({
      settings: {
        taxRate: 0.24,
        returnRate: 0.07,
        withdrawalRate: 0.04,
        inflationRate: 0.03,
        currentAge: 35,
        retirementAge: 65,
        payors: [],
        incomes: []
      },
      loading: false,
      error: null,
      updateSettings: vi.fn()
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
