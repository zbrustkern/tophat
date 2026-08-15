'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import SignInButton from "./SignInButton"
import { useState } from 'react'
import { Menu, LayoutDashboard, DollarSign, PiggyBank, GraduationCap, Target, CreditCard, Plane, Calculator, Settings, Home, ShieldCheck, KeyRound, Sparkles } from 'lucide-react'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/contexts/AuthContext'
import { RedeemCodeModal } from './RedeemCodeModal'

export function NavBar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false)
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false)
  const { settings } = useSettings()
  const { user, role } = useAuth()
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

        <div className="p-3 border-t border-white/10 bg-slate-950/80 shrink-0 space-y-3">
          {/* SaaS Pro Conversion Nudge - Only visible to Free / Guest users */}
          {role !== 'paid' && role !== 'admin' && (
            <div className="p-3 bg-slate-900/90 border border-deco-gold/30 rounded-sm space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-display font-semibold uppercase tracking-wider text-deco-gold">
                <Sparkles className="h-3.5 w-3.5 text-deco-gold" /> Unlock Tophat Pro
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Master Dashboard, HYSA Float Optimizer, and Next-Dollar Strategy.
              </p>
              <div className="pt-1 space-y-1.5">
                <button
                  onClick={() => setIsRedeemModalOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 h-7 rounded-xs bg-deco-gold hover:bg-deco-brass text-slate-950 font-display uppercase tracking-wider text-[10px] font-bold shadow-sm"
                >
                  <Sparkles className="h-3 w-3" /> Upgrade to Pro
                </button>
                <button
                  onClick={() => setIsRedeemModalOpen(true)}
                  className="w-full text-[10px] text-center text-muted-foreground hover:text-deco-gold font-display uppercase tracking-wider block py-0.5"
                >
                  Have a key? Redeem Code
                </button>
              </div>
            </div>
          )}
          <SignInButton />
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 border-b border-white/10 bg-background z-30">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsUserDrawerOpen(false);
              }} 
              className="p-1.5 hover:bg-white/10 rounded-md text-white"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link href={isHolistic ? "/dashboard" : "/"} className="flex items-center gap-2">
              <img src="/tophat_logo.png" width={28} height={28} alt="Logo" />
              <span className="text-base font-display font-semibold uppercase tracking-widest text-deco-gold">
                Tophat
              </span>
            </Link>
          </div>
          <SignInButton 
            variant="compact" 
            onAvatarClick={() => {
              setIsUserDrawerOpen(!isUserDrawerOpen);
              setIsMobileMenuOpen(false);
            }} 
          />
        </div>

        {/* Mobile Menu Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-slate-950 border-b border-white/10 shadow-2xl max-h-[calc(100vh-3.5rem)] overflow-y-auto">
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
            {role !== 'paid' && role !== 'admin' && (
              <div className="p-4 border-t border-white/10 bg-slate-900 space-y-2">
                <button
                  onClick={() => {
                    setIsRedeemModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-sm bg-deco-gold hover:bg-deco-brass text-slate-950 font-display uppercase tracking-widest text-xs font-semibold"
                >
                  <Sparkles className="h-4 w-4" /> Upgrade to Pro / Redeem Key
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mobile User Profile Drawer / Modal */}
        {isUserDrawerOpen && (
          <div className="absolute top-full right-4 w-72 bg-slate-950 border border-deco-gold/30 shadow-2xl rounded-sm p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="h-10 w-10 rounded-full bg-deco-gold/20 border border-deco-gold/40 flex items-center justify-center text-deco-gold font-display font-semibold text-sm">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                ) : (
                  user?.email ? user.email[0].toUpperCase() : 'U'
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">{user?.email}</p>
                <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-display uppercase tracking-wider font-semibold ${
                  role === 'admin' ? 'bg-deco-gold/20 text-deco-gold border border-deco-gold/40' :
                  role === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {role} Tier
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {role !== 'paid' && role !== 'admin' && (
                <button
                  onClick={() => {
                    setIsRedeemModalOpen(true);
                    setIsUserDrawerOpen(false);
                  }}
                  className="w-full flex items-center gap-2 text-xs text-slate-950 font-semibold p-2 rounded-sm bg-deco-gold hover:bg-deco-brass font-display uppercase tracking-wider"
                >
                  <Sparkles className="h-4 w-4" /> Upgrade to Pro
                </button>
              )}
              <Link
                href="/settings"
                onClick={() => setIsUserDrawerOpen(false)}
                className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-white p-2 rounded-sm hover:bg-white/5 font-display uppercase tracking-wider"
              >
                <Settings className="h-4 w-4" /> Global Settings
              </Link>
            </div>

            <div className="border-t border-white/10 pt-3">
              <SignInButton variant="navbar" />
            </div>
          </div>
        )}
      </div>

      {/* License Code Modal */}
      <RedeemCodeModal isOpen={isRedeemModalOpen} onClose={() => setIsRedeemModalOpen(false)} />
    </>
  )
}