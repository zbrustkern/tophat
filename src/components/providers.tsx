'use client'

import { PlansProvider } from "@/contexts/PlansContext"
import { AuthProvider } from "@/contexts/AuthContext"
import { SettingsProvider } from "@/contexts/SettingsContext"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <PlansProvider>
          {children}
        </PlansProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}