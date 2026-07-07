'use client'

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase/clientApp';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { GlobalSettings } from '@/types/chart';

interface SettingsContextType {
  settings: GlobalSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<GlobalSettings>) => Promise<void>;
}

const defaultSettings: GlobalSettings = {
  taxRate: 0.24,
  returnRate: 0.07,
  withdrawalRate: 0.04,
  inflationRate: 0.03,
  currentAge: 35,
  retirementAge: 65,
  payors: ['Person 1', 'Person 2', 'Joint'],
  incomes: [
    { payorId: 'Person 1', amount: 100000 },
    { payorId: 'Person 2', amount: 0 }
  ],
  filingStatus: 'Single',
  stateOfResidence: 'TX',
  dependents: 0
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !db) {
      setSettings(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    
    // Listen to the global settings document
    const docRef = doc(db, 'users', user.uid, 'settings', 'global');
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<GlobalSettings>;
        setSettings({ ...defaultSettings, ...data });
      } else {
        // If it doesn't exist, provide the default settings
        setSettings(defaultSettings);
      }
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Error subscribing to global settings:", err);
      setError("Failed to load global settings.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateSettings = async (newSettings: Partial<GlobalSettings>) => {
    if (!user || !db) throw new Error("Must be logged in to update settings.");
    
    const docRef = doc(db, 'users', user.uid, 'settings', 'global');
    await setDoc(docRef, newSettings, { merge: true });
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, error, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
