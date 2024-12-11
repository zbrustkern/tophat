'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import SignInButton from "./SignInButton"
import { LayoutDashboard, DollarSign, PiggyBank, Menu } from 'lucide-react'
import { useState } from 'react'

export function NavBar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const routes = [
    {
      href: "/",
      label: "Dashboard",
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
    }
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 h-screen w-64 border-r bg-background flex-col">
        <div className="flex flex-col items-center py-6 border-b">
          <img
            src="/tophat_logo.png"
            width={120}
            height={120}
            alt="Tophat logo"
            className="mb-2"
          />
          <span className="text-xl font-semibold text-orange-300">
            Tophat Financial
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {routes.map((route) => {
            const isActive = pathname === route.href;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-sky-100 text-blue-600' 
                    : 'hover:bg-sky-100 hover:text-blue-600'
                  }`}
              >
                {route.icon}
                <span>{route.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <SignInButton />
        </div>
      </div>

      {/* Mobile Top Navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 border-b bg-background z-50">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="p-1 hover:bg-gray-100 rounded-md"
            >
              <Menu className="h-6 w-6" />
            </button>
            <span className="text-lg font-semibold text-orange-300">Tophat</span>
          </div>
          <SignInButton />
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-background border-b shadow-lg">
            <nav className="flex flex-col p-2">
              {routes.map((route) => {
                const isActive = pathname === route.href;
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-sky-100 text-blue-600' 
                        : 'hover:bg-sky-100 hover:text-blue-600'
                      }`}
                  >
                    {route.icon}
                    <span>{route.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Add padding to main content area on mobile */}
      <div className="md:hidden h-14" />
    </>
  )
}