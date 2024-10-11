'use client'

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { BasePlanData } from '@/types/chart';

interface PlansContextType {
  plans: BasePlanData[];
  loading: boolean;
  error: string | null;
  refreshPlans: () => Promise<void>;
}

const PlansContext = createContext<PlansContextType | undefined>(undefined);

export const PlansProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<BasePlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const functions = getFunctions();
    const listPlans = httpsCallable(functions, 'list_plans');

    try {
      const result = await listPlans();
      const plansData = (result.data as any).plans as BasePlanData[];
      setPlans(plansData);
    } catch (error) {
      console.error("Error fetching plans:", error);
      setError("Failed to load plans. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPlans();
    } else {
      setPlans([]);
      setLoading(false);
      setError(null);
    }
  }, [user, fetchPlans]);

  return (
    <PlansContext.Provider value={{ plans, loading, error, refreshPlans: fetchPlans }}>
      {children}
    </PlansContext.Provider>
  );
};

export const usePlans = () => {
  const context = useContext(PlansContext);
  if (context === undefined) {
    throw new Error('usePlans must be used within a PlansProvider');
  }
  return context;
};