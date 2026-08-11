'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged } from '@/lib/firebase/auth';

import { UserRole, getUserRole } from '@/lib/licensing';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRoleState] = useState<UserRole>('guest');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        try {
          // Read cryptographically signed JWT Custom Claims from Google Auth server
          const idTokenResult = await user.getIdTokenResult(true); // force refresh
          const claimRole = idTokenResult.claims.role as UserRole | undefined;
          
          if (claimRole) {
            setRoleState(claimRole);
          } else {
            setRoleState(getUserRole(user.email));
          }
        } catch (e) {
          console.error("Error reading Auth JWT Claims:", e);
          setRoleState(getUserRole(user.email));
        }
      } else {
        setRoleState('guest');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
  };

  return (
    <AuthContext.Provider value={{ user, loading, role, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}