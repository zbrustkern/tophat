'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import SignInButton from "./SignInButton"
import { useState } from 'react'
import { Menu, LayoutDashboard, DollarSign, PiggyBank, GraduationCap, Target, CreditCard, Plane, Calculator, Settings, Home, ShieldCheck } from 'lucide-react'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/contexts/AuthContext'

export function NavBar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { settings } = useSettings()
  const { role } = useAuth()
  const isHolistic = settings?.holisticModeEnabled !== false // defaults to true
  
  const routes = [
    ...(isHolistic ? [{
      href: "/dashboard",
      label: "Master Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />
    }] : []),
    {
      href: "/",
      label: "My Plans",
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      href: "/income",
      label: "Income",
      icon: <DollarSign className="h-5 w-5" />
    },
    {
      href: "/savings",
      label: "Savings",
      icon: <PiggyBank className="h-5 w-5" />
    },
    {
      href: "/college",
      label: "College (529)",
      icon: <GraduationCap className="h-5 w-5" />
    },
    {
      href: "/house",
      label: "Real Estate",
      icon: <Home className="h-5 w-5" />
    },
    {
      href: "/tactical-allocation",
      label: "Portfolio",
      icon: <Target className="h-5 w-5" />
    },
    {
      href: "/wallet",
      label: "My Wallet",
      icon: <CreditCard className="h-5 w-5" />
    },
    {
      href: "/airline-status",
      label: "Airline Status Optimizer",
      icon: <Plane className="h-5 w-5" />
    },
    {
      href: "/budget",
      label: "Budget Planner",
      icon: <Calculator className="h-5 w-5" />
    },
    {
      href: "/settings",
      label: "Global Settings",
      icon: <Settings className="h-5 w-5" />
    },
    ...(role === 'admin' ? [{
      href: "/admin",
      label: "Admin Console",
      icon: <ShieldCheck className="h-5 w-5 text-deco-gold" />
    }] : [])
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 h-screen w-64 border-r bg-background flex-col z-30 shadow-2xl">
        <div className="flex flex-col items-center py-4 border-b shrink-0">
          <Link href={isHolistic ? "/dashboard" : "/"} className="flex flex-col items-center group">
            <img
              src="/tophat_logo.png"
              width={72}
              height={72}
              alt="Tophat logo"
              className="mb-1 transition-transform group-hover:scale-105 drop-shadow-[0_0_12px_rgba(212,175,55,0.3)]"
            />
            <span className="text-sm font-display font-semibold uppercase tracking-widest text-deco-gold transition-colors group-hover:text-deco-brass mt-1">
              Tophat Financial
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-3 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-white/10">
          {routes.map((route) => {
            const isActive = pathname === route.href;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={`flex h-9 items-center gap-3 rounded-sm px-3 text-xs font-medium transition-colors
                  ${isActive 
                    ? 'bg-deco-gold/15 text-deco-gold border-r-2 border-deco-gold font-semibold' 
                    : 'text-muted-foreground hover:bg-deco-gold/5 hover:text-deco-gold'
                  }`}
              >
                {route.icon}
                <span>{route.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t bg-slate-950/80 shrink-0">
          <SignInButton />
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 border-b bg-background z-30">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="p-1 hover:bg-gray-100 rounded-md"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link href={isHolistic ? "/dashboard" : "/"} className="text-lg font-display font-semibold uppercase tracking-widest text-deco-gold hover:text-deco-brass">
              Tophat
            </Link>
          </div>
          <SignInButton />
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-slate-950 border-b shadow-2xl max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <nav className="flex flex-col p-3 space-y-1">
              {routes.map((route) => {
                const isActive = pathname === route.href;
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-sm text-xs font-medium transition-colors
                      ${isActive 
                        ? 'bg-deco-gold/15 text-deco-gold border-l-2 border-deco-gold font-semibold' 
                        : 'text-muted-foreground hover:bg-deco-gold/5 hover:text-deco-gold'
                      }`}
                  >
                    {route.icon}
                    <span>{route.label}</span>
                  </Link>
                )
              })}
            </nav>
            <div className="p-4 border-t border-white/10 bg-slate-900">
              <SignInButton />
            </div>
          </div>
        )}
      </div>
    </>
  )
}