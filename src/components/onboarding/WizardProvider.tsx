"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';

export type WizardHolding = { id: string; ticker: string; shares: number; price: number; riskTier: 'core' | 'growth' | 'speculative' | 'cash'; };
export type WizardAsset = { id: string; name: string; type: string; isPlaceholder: boolean; holdings: WizardHolding[]; };
export type WizardIncome = { id: string; source: string; amount: number; expectedGrowth: number; };
export type WizardDebt = { id: string; name: string; type: string; balance: number; rate: number; payment: number; };
export type WizardGoal = { id: string; name: string; type: 'college' | 'house' | 'income_stream'; targetAmount?: number; timelineYears?: number; linkedAssetIds: string[]; };
export type WizardBudget = { housing: number; utilities: number; auto: number; food: number; insurance: number; kids: number; discretionary: number; };

export interface WizardState {
  currentStep: number;
  
  // Step 1: Basics
  age: number;
  retirementAge: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  
  // Step 2: Income
  incomes: WizardIncome[];
  
  // Step 3: Assets
  assets: WizardAsset[];
  
  // Step 4: Debts
  debts: WizardDebt[];
  
  // Step 5: Budget
  budget: WizardBudget;
  
  // Step 6: Goals
  goals: WizardGoal[];
}

interface WizardContextType {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  nextStep: () => void;
  prevStep: () => void;
  addIncome: (income: Omit<WizardIncome, 'id'>) => void;
  removeIncome: (id: string) => void;
  addAsset: (asset: Omit<WizardAsset, 'id'>) => void;
  removeAsset: (id: string) => void;
  addDebt: (debt: Omit<WizardDebt, 'id'>) => void;
  removeDebt: (id: string) => void;
  addGoal: (goal: Omit<WizardGoal, 'id'>) => void;
  removeGoal: (id: string) => void;
}

const initialState: WizardState = {
  currentStep: 1,
  age: 30,
  retirementAge: 65,
  riskTolerance: 'moderate',
  incomes: [],
  assets: [],
  debts: [],
  budget: { housing: 0, utilities: 0, auto: 0, food: 0, insurance: 0, kids: 0, discretionary: 0 },
  goals: [],
};

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WizardState>(initialState);

  const updateState = (updates: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => updateState({ currentStep: state.currentStep + 1 });
  const prevStep = () => updateState({ currentStep: Math.max(1, state.currentStep - 1) });

  const addIncome = (income: Omit<WizardIncome, 'id'>) => {
    updateState({ incomes: [...state.incomes, { ...income, id: uuidv4() }] });
  };
  const removeIncome = (id: string) => {
    updateState({ incomes: state.incomes.filter(i => i.id !== id) });
  };

  const addAsset = (asset: Omit<WizardAsset, 'id'>) => {
    updateState({ assets: [...state.assets, { ...asset, id: uuidv4() }] });
  };
  const removeAsset = (id: string) => {
    updateState({ assets: state.assets.filter(a => a.id !== id) });
  };

  const addDebt = (debt: Omit<WizardDebt, 'id'>) => {
    updateState({ debts: [...state.debts, { ...debt, id: uuidv4() }] });
  };
  const removeDebt = (id: string) => {
    updateState({ debts: state.debts.filter(d => d.id !== id) });
  };

  const addGoal = (goal: Omit<WizardGoal, 'id'>) => {
    updateState({ goals: [...state.goals, { ...goal, id: uuidv4() }] });
  };
  const removeGoal = (id: string) => {
    updateState({ goals: state.goals.filter(g => g.id !== id) });
  };

  return (
    <WizardContext.Provider value={{
      state, updateState, nextStep, prevStep,
      addIncome, removeIncome, addAsset, removeAsset,
      addDebt, removeDebt, addGoal, removeGoal
    }}>
      {children}
    </WizardContext.Provider>
  );
}

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) throw new Error('useWizard must be used within WizardProvider');
  return context;
};
