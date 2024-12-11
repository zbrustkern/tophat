'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import SignInButton from "./SignInButton"

export function NavBar() {
  const pathname = usePathname()
  
  const routes = [
    {
      href: "/",
      label: "Dashboard",
      icon: "📊"
    },
    {
      href: "/income",
      label: "Income",
      icon: "$"
    },
    {
      href: "/savings",
      label: "Savings",
      icon: "%"
    }
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex sticky top-0 h-screen w-64 border-r bg-background py-4 flex-col">
        <div className="flex flex-col items-center py-6 border-b">
          <img
            src="/tophat_logo.png"
            width={160}
            height={160}
            alt="Tophat logo"
            className="mb-2"
          />
          <span className="text-xl font-semibold text-orange-300">
            Tophat Financial
          </span>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {routes.map((route) => {
            const isActive = pathname === route.href;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={`flex h-12 items-center justify-start gap-3 rounded-md px-4 text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-sky-100 text-blue-600' 
                    : 'hover:bg-sky-100 hover:text-blue-600'
                  }`}
              >
                <span className="flex h-6 w-6 items-center justify-center text-lg">
                  {route.icon}
                </span>
                <span>{route.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <SignInButton />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background">
        <nav className="flex justify-around items-center h-16">
          {routes.map((route) => {
            const isActive = pathname === route.href;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={`flex flex-col items-center justify-center w-20 py-1
                  ${isActive 
                    ? 'text-blue-600' 
                    : 'text-gray-600 hover:text-blue-600'
                  }`}
              >
                <span className="text-xl mb-1">{route.icon}</span>
                <span className="text-xs">{route.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Mobile Sign In Button */}
        <div className="absolute top-0 right-0 transform -translate-y-full bg-background p-2 border-l border-b rounded-bl-md">
          <SignInButton />
        </div>
      </div>
    </>
  )
}