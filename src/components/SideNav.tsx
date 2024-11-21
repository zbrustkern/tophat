'use client';

import Link from "next/link"
import { usePathname } from "next/navigation"

export function SideNav() {
  const pathname = usePathname()
  
  const routes = [
    {
      href: "/",
      label: "Dashboard",
      icon: "📊"
    },
    {
      href: "/income",
      label: "Income Planner",
      icon: "$"
    },
    {
      href: "/savings",
      label: "Savings Planner",
      icon: "%"
    }
  ]

  return (
    <div className="sticky top-0 h-screen w-64 border-r bg-background py-4 flex flex-col">
      {/* Logo Section */}
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

      {/* Navigation Links */}
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
    </div>
  )
}