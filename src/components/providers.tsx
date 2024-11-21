'use client'

import { PlansProvider } from "@/contexts/PlansContext"
import { AuthProvider } from "@/contexts/AuthContext"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PlansProvider>
        {children}
      </PlansProvider>
    </AuthProvider>
  )
}