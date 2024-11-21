'use client';

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

export function SideNav() {
  const pathname = usePathname()
  
  const routes = [
    {
      href: "/",
      label: "Dashboard",
      active: pathname === "/",
    },
    {
      href: "/income",
      label: "Income Planner",
      active: pathname === "/income",
    },
    {
      href: "/savings",
      label: "Savings Planner",
      active: pathname === "/savings",
    }
  ]

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted px-3 py-4">
      <div className="flex h-14 items-center px-3">
        <Link href="/" className="flex items-center space-x-2 font-semibold">
          <span>Financial Planner</span>
        </Link>
      </div>
      <div className="flex-1 space-y-1 py-4">
        {routes.map((route) => (
          <Button
            key={route.href}
            variant={route.active ? "secondary" : "ghost"}
            className="w-full justify-start"
            asChild
          >
            <Link href={route.href}>{route.label}</Link>
          </Button>
        ))}
      </div>
    </div>
  )
}